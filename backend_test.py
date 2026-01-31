#!/usr/bin/env python3
"""
BudgetFly Backend API Testing Script
Tests all CRUD operations for budget items, family members, and summary endpoint
"""

import requests
import json
import sys
from typing import Dict, Any, List

# Use the production backend URL from frontend .env
BASE_URL = "https://build-cost-manager-1.preview.emergentagent.com/api"

class BudgetFlyTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.created_items = []
        self.created_members = []
        self.test_results = {
            "family_members": {"passed": 0, "failed": 0, "errors": []},
            "budget_items": {"passed": 0, "failed": 0, "errors": []},
            "summary": {"passed": 0, "failed": 0, "errors": []}
        }

    def log_result(self, category: str, test_name: str, success: bool, error_msg: str = ""):
        """Log test results"""
        if success:
            self.test_results[category]["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.test_results[category]["failed"] += 1
            self.test_results[category]["errors"].append(f"{test_name}: {error_msg}")
            print(f"❌ {test_name}: {error_msg}")

    def test_family_members_crud(self):
        """Test Family Members CRUD operations"""
        print("\n=== Testing Family Members CRUD ===")
        
        # Test 1: Create family members
        members_to_create = ["John Smith", "Mary Johnson", "David Wilson"]
        
        for name in members_to_create:
            try:
                response = requests.post(
                    f"{self.base_url}/family-members",
                    json={"name": name},
                    timeout=10
                )
                
                if response.status_code == 200:
                    member_data = response.json()
                    if "id" in member_data and member_data["name"] == name:
                        self.created_members.append(member_data["id"])
                        self.log_result("family_members", f"Create family member '{name}'", True)
                    else:
                        self.log_result("family_members", f"Create family member '{name}'", False, "Invalid response structure")
                else:
                    self.log_result("family_members", f"Create family member '{name}'", False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result("family_members", f"Create family member '{name}'", False, str(e))

        # Test 2: Get all family members
        try:
            response = requests.get(f"{self.base_url}/family-members", timeout=10)
            
            if response.status_code == 200:
                members = response.json()
                if isinstance(members, list) and len(members) >= len(self.created_members):
                    self.log_result("family_members", "Get all family members", True)
                else:
                    self.log_result("family_members", "Get all family members", False, f"Expected list with at least {len(self.created_members)} members, got {len(members) if isinstance(members, list) else 'non-list'}")
            else:
                self.log_result("family_members", "Get all family members", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("family_members", "Get all family members", False, str(e))

        # Test 3: Delete family members
        for member_id in self.created_members[:1]:  # Delete only first member to keep others for budget items
            try:
                response = requests.delete(f"{self.base_url}/family-members/{member_id}", timeout=10)
                
                if response.status_code == 200:
                    self.log_result("family_members", f"Delete family member {member_id}", True)
                else:
                    self.log_result("family_members", f"Delete family member {member_id}", False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result("family_members", f"Delete family member {member_id}", False, str(e))

        # Test 4: Validation - empty name
        try:
            response = requests.post(
                f"{self.base_url}/family-members",
                json={"name": ""},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("family_members", "Validation - empty name rejection", True)
            else:
                self.log_result("family_members", "Validation - empty name rejection", False, "Should reject empty name")
                
        except Exception as e:
            self.log_result("family_members", "Validation - empty name rejection", False, str(e))

    def test_budget_items_crud(self):
        """Test Budget Items CRUD operations"""
        print("\n=== Testing Budget Items CRUD ===")
        
        # Ensure we have at least one family member for testing
        if not self.created_members:
            try:
                response = requests.post(
                    f"{self.base_url}/family-members",
                    json={"name": "Test User"},
                    timeout=10
                )
                if response.status_code == 200:
                    self.created_members.append(response.json()["id"])
            except:
                pass

        paid_by = self.created_members[0] if self.created_members else "Test User"

        # Test 1: Create budget items with different payment types
        items_to_create = [
            {
                "item_name": "Cement Bags",
                "price": 450.0,
                "quantity": 10,
                "recipient": "Building Materials Store",
                "payment_type": "cash",
                "paid_by": paid_by
            },
            {
                "item_name": "Steel Rods",
                "price": 1200.0,
                "quantity": 5,
                "recipient": "Steel Supplier",
                "payment_type": "online",
                "paid_by": paid_by
            },
            {
                "item_name": "Paint Cans",
                "price": 800.0,
                "quantity": 3,
                "recipient": "Paint Shop",
                "payment_type": "cash",
                "paid_by": paid_by
            }
        ]
        
        for item_data in items_to_create:
            try:
                response = requests.post(
                    f"{self.base_url}/items",
                    json=item_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    item_response = response.json()
                    if "id" in item_response and item_response["item_name"] == item_data["item_name"]:
                        self.created_items.append(item_response["id"])
                        self.log_result("budget_items", f"Create item '{item_data['item_name']}'", True)
                    else:
                        self.log_result("budget_items", f"Create item '{item_data['item_name']}'", False, "Invalid response structure")
                else:
                    self.log_result("budget_items", f"Create item '{item_data['item_name']}'", False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result("budget_items", f"Create item '{item_data['item_name']}'", False, str(e))

        # Test 2: Get all items
        try:
            response = requests.get(f"{self.base_url}/items", timeout=10)
            
            if response.status_code == 200:
                items = response.json()
                if isinstance(items, list) and len(items) >= len(self.created_items):
                    self.log_result("budget_items", "Get all items", True)
                else:
                    self.log_result("budget_items", "Get all items", False, f"Expected list with at least {len(self.created_items)} items")
            else:
                self.log_result("budget_items", "Get all items", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("budget_items", "Get all items", False, str(e))

        # Test 3: Get single item
        if self.created_items:
            item_id = self.created_items[0]
            try:
                response = requests.get(f"{self.base_url}/items/{item_id}", timeout=10)
                
                if response.status_code == 200:
                    item = response.json()
                    if item["id"] == item_id:
                        self.log_result("budget_items", f"Get single item {item_id}", True)
                    else:
                        self.log_result("budget_items", f"Get single item {item_id}", False, "ID mismatch in response")
                else:
                    self.log_result("budget_items", f"Get single item {item_id}", False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result("budget_items", f"Get single item {item_id}", False, str(e))

        # Test 4: Update item
        if self.created_items:
            item_id = self.created_items[0]
            update_data = {
                "item_name": "Updated Cement Bags",
                "price": 500.0,
                "quantity": 12
            }
            
            try:
                response = requests.put(
                    f"{self.base_url}/items/{item_id}",
                    json=update_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    updated_item = response.json()
                    if (updated_item["item_name"] == update_data["item_name"] and 
                        updated_item["price"] == update_data["price"] and
                        updated_item["quantity"] == update_data["quantity"]):
                        self.log_result("budget_items", f"Update item {item_id}", True)
                    else:
                        self.log_result("budget_items", f"Update item {item_id}", False, "Update data not reflected")
                else:
                    self.log_result("budget_items", f"Update item {item_id}", False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result("budget_items", f"Update item {item_id}", False, str(e))

        # Test 5: Delete item
        if self.created_items:
            item_id = self.created_items[-1]  # Delete last item
            try:
                response = requests.delete(f"{self.base_url}/items/{item_id}", timeout=10)
                
                if response.status_code == 200:
                    self.log_result("budget_items", f"Delete item {item_id}", True)
                    self.created_items.remove(item_id)
                else:
                    self.log_result("budget_items", f"Delete item {item_id}", False, f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_result("budget_items", f"Delete item {item_id}", False, str(e))

        # Test 6: Validation - invalid payment type
        try:
            invalid_item = {
                "item_name": "Test Item",
                "price": 100.0,
                "quantity": 1,
                "recipient": "Test Recipient",
                "payment_type": "invalid_type",
                "paid_by": paid_by
            }
            
            response = requests.post(
                f"{self.base_url}/items",
                json=invalid_item,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("budget_items", "Validation - invalid payment type rejection", True)
            else:
                self.log_result("budget_items", "Validation - invalid payment type rejection", False, "Should reject invalid payment type")
                
        except Exception as e:
            self.log_result("budget_items", "Validation - invalid payment type rejection", False, str(e))

    def test_summary_endpoint(self):
        """Test Budget Summary endpoint"""
        print("\n=== Testing Summary Endpoint ===")
        
        try:
            response = requests.get(f"{self.base_url}/summary", timeout=10)
            
            if response.status_code == 200:
                summary = response.json()
                
                # Check if all required fields are present
                required_fields = ["total_amount", "total_items", "cash_total", "online_total"]
                missing_fields = [field for field in required_fields if field not in summary]
                
                if not missing_fields:
                    # Verify calculation logic
                    if (isinstance(summary["total_amount"], (int, float)) and
                        isinstance(summary["total_items"], int) and
                        isinstance(summary["cash_total"], (int, float)) and
                        isinstance(summary["online_total"], (int, float))):
                        
                        # Check if cash_total + online_total = total_amount
                        calculated_total = summary["cash_total"] + summary["online_total"]
                        if abs(calculated_total - summary["total_amount"]) < 0.01:  # Allow for floating point precision
                            self.log_result("summary", "Get summary with correct calculations", True)
                        else:
                            self.log_result("summary", "Get summary with correct calculations", False, 
                                          f"Total mismatch: cash({summary['cash_total']}) + online({summary['online_total']}) != total({summary['total_amount']})")
                    else:
                        self.log_result("summary", "Get summary with correct calculations", False, "Invalid data types in response")
                else:
                    self.log_result("summary", "Get summary with correct calculations", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("summary", "Get summary with correct calculations", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("summary", "Get summary with correct calculations", False, str(e))

    def cleanup(self):
        """Clean up created test data"""
        print("\n=== Cleaning up test data ===")
        
        # Delete remaining items
        for item_id in self.created_items:
            try:
                requests.delete(f"{self.base_url}/items/{item_id}", timeout=5)
            except:
                pass
        
        # Delete remaining members
        for member_id in self.created_members:
            try:
                requests.delete(f"{self.base_url}/family-members/{member_id}", timeout=5)
            except:
                pass

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print("BUDGETFLY BACKEND API TEST SUMMARY")
        print("="*50)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            print(f"\n{category.upper().replace('_', ' ')}:")
            print(f"  ✅ Passed: {passed}")
            print(f"  ❌ Failed: {failed}")
            
            if results["errors"]:
                print(f"  Errors:")
                for error in results["errors"]:
                    print(f"    - {error}")
        
        print(f"\nOVERALL RESULTS:")
        print(f"  ✅ Total Passed: {total_passed}")
        print(f"  ❌ Total Failed: {total_failed}")
        print(f"  📊 Success Rate: {(total_passed/(total_passed+total_failed)*100):.1f}%" if (total_passed+total_failed) > 0 else "  📊 Success Rate: N/A")
        
        return total_failed == 0

    def run_all_tests(self):
        """Run all backend API tests"""
        print("Starting BudgetFly Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        
        try:
            # Test in order of priority (high first)
            self.test_family_members_crud()
            self.test_budget_items_crud()
            self.test_summary_endpoint()
            
        finally:
            self.cleanup()
        
        return self.print_summary()


if __name__ == "__main__":
    tester = BudgetFlyTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)