from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Enums
class PaymentType(str, Enum):
    cash = "cash"
    online = "online"


# Define Models
class BudgetItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_name: str
    price: float
    quantity: int = 1
    recipient: str  # To whom payment was made
    payment_type: PaymentType
    paid_by: str  # Family member who made payment
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BudgetItemCreate(BaseModel):
    item_name: str
    price: float
    quantity: int = 1
    recipient: str
    payment_type: PaymentType
    paid_by: str


class BudgetItemUpdate(BaseModel):
    item_name: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    recipient: Optional[str] = None
    payment_type: Optional[PaymentType] = None
    paid_by: Optional[str] = None


class BudgetSummary(BaseModel):
    total_amount: float
    total_items: int
    cash_total: float
    online_total: float


# Family Members model
class FamilyMember(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FamilyMemberCreate(BaseModel):
    name: str


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "BudgetFly API"}


# Budget Items CRUD
@api_router.post("/items", response_model=BudgetItem)
async def create_budget_item(input: BudgetItemCreate):
    item_dict = input.dict()
    item_obj = BudgetItem(**item_dict)
    await db.budget_items.insert_one(item_obj.dict())
    return item_obj


@api_router.get("/items", response_model=List[BudgetItem])
async def get_budget_items():
    items = await db.budget_items.find().sort("created_at", -1).to_list(1000)
    return [BudgetItem(**item) for item in items]


@api_router.get("/items/{item_id}", response_model=BudgetItem)
async def get_budget_item(item_id: str):
    item = await db.budget_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return BudgetItem(**item)


@api_router.put("/items/{item_id}", response_model=BudgetItem)
async def update_budget_item(item_id: str, input: BudgetItemUpdate):
    item = await db.budget_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = {k: v for k, v in input.dict().items() if v is not None}
    if update_data:
        await db.budget_items.update_one({"id": item_id}, {"$set": update_data})
    
    updated_item = await db.budget_items.find_one({"id": item_id})
    return BudgetItem(**updated_item)


@api_router.delete("/items/{item_id}")
async def delete_budget_item(item_id: str):
    result = await db.budget_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}


@api_router.get("/summary", response_model=BudgetSummary)
async def get_budget_summary():
    items = await db.budget_items.find().to_list(1000)
    
    total_amount = 0
    cash_total = 0
    online_total = 0
    
    for item in items:
        item_total = item['price'] * item['quantity']
        total_amount += item_total
        if item['payment_type'] == 'cash':
            cash_total += item_total
        else:
            online_total += item_total
    
    return BudgetSummary(
        total_amount=total_amount,
        total_items=len(items),
        cash_total=cash_total,
        online_total=online_total
    )


# Family Members CRUD
@api_router.post("/family-members", response_model=FamilyMember)
async def create_family_member(input: FamilyMemberCreate):
    member_dict = input.dict()
    member_obj = FamilyMember(**member_dict)
    await db.family_members.insert_one(member_obj.dict())
    return member_obj


@api_router.get("/family-members", response_model=List[FamilyMember])
async def get_family_members():
    members = await db.family_members.find().to_list(100)
    return [FamilyMember(**member) for member in members]


@api_router.delete("/family-members/{member_id}")
async def delete_family_member(member_id: str):
    result = await db.family_members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Family member not found")
    return {"message": "Family member deleted successfully"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
