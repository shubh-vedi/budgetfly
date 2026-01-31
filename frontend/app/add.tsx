import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface FamilyMember {
  id: string;
  name: string;
}

export default function AddItemScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  
  // Form state
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [recipient, setRecipient] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'online'>('cash');
  const [paidBy, setPaidBy] = useState('');

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/family-members`);
      if (response.ok) {
        const data = await response.json();
        setFamilyMembers(data);
        if (data.length > 0 && !paidBy) {
          setPaidBy(data[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!itemName.trim()) {
      Alert.alert('Required', 'Please enter item name');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Required', 'Please enter valid price');
      return;
    }
    if (!recipient.trim()) {
      Alert.alert('Required', 'Please enter recipient name');
      return;
    }
    if (!paidBy.trim()) {
      Alert.alert('Required', 'Please select who paid');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_name: itemName.trim(),
          price: parseFloat(price),
          quantity: parseInt(quantity) || 1,
          recipient: recipient.trim(),
          payment_type: paymentType,
          paid_by: paidBy.trim(),
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Item added successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setItemName('');
              setPrice('');
              setQuantity('1');
              setRecipient('');
              // Navigate to home
              router.push('/');
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Item Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g., Bricks, Cement, Sand"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Price and Quantity Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.rowGap} />
            
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Recipient */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paid To (Recipient) *</Text>
            <TextInput
              style={styles.input}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="e.g., Supplier name, Shop name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Payment Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Type *</Text>
            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentType === 'cash' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentType('cash')}
              >
                <Ionicons 
                  name="cash-outline" 
                  size={24} 
                  color={paymentType === 'cash' ? '#059669' : '#6B7280'} 
                />
                <Text style={[
                  styles.paymentOptionText,
                  paymentType === 'cash' && styles.paymentOptionTextActive,
                ]}>
                  Cash
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentType === 'online' && styles.paymentOptionActiveOnline,
                ]}
                onPress={() => setPaymentType('online')}
              >
                <Ionicons 
                  name="card-outline" 
                  size={24} 
                  color={paymentType === 'online' ? '#2563EB' : '#6B7280'} 
                />
                <Text style={[
                  styles.paymentOptionText,
                  paymentType === 'online' && styles.paymentOptionTextActiveOnline,
                ]}>
                  Online
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Paid By */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paid By (Family Member) *</Text>
            {familyMembers.length > 0 ? (
              <View style={styles.memberOptions}>
                {familyMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberOption,
                      paidBy === member.name && styles.memberOptionActive,
                    ]}
                    onPress={() => setPaidBy(member.name)}
                  >
                    <Ionicons 
                      name="person-outline" 
                      size={20} 
                      color={paidBy === member.name ? '#2563EB' : '#6B7280'} 
                    />
                    <Text style={[
                      styles.memberOptionText,
                      paidBy === member.name && styles.memberOptionTextActive,
                    ]}>
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={paidBy}
                onChangeText={setPaidBy}
                placeholder="Enter family member name"
                placeholderTextColor="#9CA3AF"
              />
            )}
            <Text style={styles.helperText}>
              Add family members in "Family" tab
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Add Item</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  rowGap: {
    width: 16,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  paymentOptionActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  paymentOptionActiveOnline: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  paymentOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  paymentOptionTextActive: {
    color: '#059669',
  },
  paymentOptionTextActiveOnline: {
    color: '#2563EB',
  },
  memberOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  memberOptionActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  memberOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  memberOptionTextActive: {
    color: '#2563EB',
  },
  helperText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 18,
    marginTop: 20,
    gap: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
