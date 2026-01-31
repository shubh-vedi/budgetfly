import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface BudgetItem {
  id: string;
  item_name: string;
  price: number;
  quantity: number;
  recipient: string;
  payment_type: 'cash' | 'online';
  paid_by: string;
  created_at: string;
}

interface Summary {
  total_amount: number;
  total_items: number;
  cash_total: number;
  online_total: number;
}

export default function HomeScreen() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_amount: 0,
    total_items: 0,
    cash_total: 0,
    online_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [itemsRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/items`),
        fetch(`${API_URL}/api/summary`),
      ]);
      
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }
      
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const deleteItem = async (id: string, itemName: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${itemName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/items/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                fetchData();
              }
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: BudgetItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteItem(item.id, item.item_name)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={18} color="#6B7280" />
          <Text style={styles.detailText}>
            {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={18} color="#6B7280" />
          <Text style={styles.detailText}>To: {item.recipient}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={18} color="#6B7280" />
          <Text style={styles.detailText}>Paid by: {item.paid_by}</Text>
        </View>
        
        <View style={styles.itemFooter}>
          <View style={[
            styles.paymentBadge,
            item.payment_type === 'cash' ? styles.cashBadge : styles.onlineBadge
          ]}>
            <Ionicons 
              name={item.payment_type === 'cash' ? 'cash-outline' : 'card-outline'} 
              size={14} 
              color={item.payment_type === 'cash' ? '#059669' : '#2563EB'} 
            />
            <Text style={[
              styles.paymentText,
              item.payment_type === 'cash' ? styles.cashText : styles.onlineText
            ]}>
              {item.payment_type === 'cash' ? 'Cash' : 'Online'}
            </Text>
          </View>
          
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Expenses</Text>
        <Text style={styles.totalAmount}>{formatCurrency(summary.total_amount)}</Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Ionicons name="cash-outline" size={20} color="#059669" />
            <Text style={styles.summaryLabel}>Cash</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.cash_total)}</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryItem}>
            <Ionicons name="card-outline" size={20} color="#2563EB" />
            <Text style={styles.summaryLabel}>Online</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.online_total)}</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryItem}>
            <Ionicons name="receipt-outline" size={20} color="#6B7280" />
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{summary.total_items}</Text>
          </View>
        </View>
      </View>

      {/* Items List */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Expenses Yet</Text>
          <Text style={styles.emptySubtitle}>Tap "Add Item" to add your first expense</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#4B5563',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  cashBadge: {
    backgroundColor: '#D1FAE5',
  },
  onlineBadge: {
    backgroundColor: '#DBEAFE',
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cashText: {
    color: '#059669',
  },
  onlineText: {
    color: '#2563EB',
  },
  dateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
