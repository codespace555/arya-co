import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState, memo } from 'react';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';

import { db } from '../services/firebase';
import { DashboardStackParamList } from '../types/navigation';

// --- Type Definitions for better type safety ---
interface Order {
  id: string;
  userId: string;
  productName: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderedAt: { toDate: () => Date };
  deliveryDate: { toDate: () => Date };
}

interface User {
  id: string;
  name?: string;
  phone?: string;
}

// --- Memoized OrderCard Component for Performance ---
// By using React.memo, this component only re-renders if its specific props change.
const OrderCard = memo(
  ({
    item,
    user,
    onStatusUpdate,
  }: {
    item: Order;
    user: User | undefined;
    onStatusUpdate: (id: string, status: Order['status']) => void;
  }) => {
    const statusOptions: Order['status'][] = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    
    // Dynamically set colors based on status
    const statusColors: { [key in Order['status']]: string } = {
      pending: 'bg-yellow-500',
      processing: 'bg-blue-500',
      shipped: 'bg-indigo-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
    };

    return (
      <View className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
        {/* --- Header Section --- */}
        <View className="flex-row items-center justify-between bg-gray-50 p-3">
          <View>
            <Text className="text-base font-bold text-gray-800">{user?.name || 'Unknown User'}</Text>
            <Text className="text-sm text-gray-500">{user?.phone || 'No phone number'}</Text>
          </View>
          <View className={`rounded-full px-3 py-1 ${statusColors[item.status]}`}>
            <Text className="text-xs font-bold capitalize text-white">{item.status}</Text>
          </View>
        </View>

        {/* --- Body Section --- */}
        <View className="p-4">
          <Text className="mb-2 text-lg font-semibold text-gray-900">
            {item.productName || 'N/A'}
          </Text>
          <View className="mb-3 flex-row justify-between">
            <Text className="text-gray-600">
              Quantity: {item.quantity} {item.unit}
            </Text>
            <Text className="font-bold text-gray-800">Total: ₹{item.totalPrice}</Text>
          </View>
          <View className="border-t border-gray-200 pt-2">
            <Text className="text-xs text-gray-500">
              Ordered: {format(item.orderedAt.toDate(), 'dd MMM yyyy, hh:mm a')}
            </Text>
            <Text className="text-xs text-gray-500">
              Delivery: {format(item.deliveryDate.toDate(), 'dd MMM yyyy')}
            </Text>
          </View>
        </View>

        {/* --- Actions Section --- */}
        <View className="bg-gray-50 p-3">
          <Text className="mb-2 text-xs font-medium text-gray-500">CHANGE STATUS</Text>
          <View className="flex-row flex-wrap">
            {statusOptions
              .filter((status) => status !== item.status) // Don't show a button for the current status
              .map((status) => (
                <TouchableOpacity
                  key={status}
                  className="mb-2 mr-2 rounded-md bg-gray-200 px-3 py-1.5"
                  onPress={() => onStatusUpdate(item.id, status)}>
                  <Text className="text-xs font-semibold capitalize text-gray-700">{status}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </View>
    );
  }
);


export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Filter States ---
  const [statusFilter, setStatusFilter] = useState<Order['status'] | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const navigation = useNavigation<StackNavigationProp<DashboardStackParamList>>();

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch users and orders in parallel for faster loading
        const [usersSnapshot, ordersSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(query(collection(db, 'orders'), orderBy('deliveryDate', 'desc'))),
        ]);

        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersData);

        const ordersData = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(ordersData);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        Toast.show({ type: 'error', text1: 'Failed to load data.' });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // --- Memoized User Map for O(1) Lookups ---
  // This prevents re-calculating the user map on every render.
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  // --- Memoized Filtering Logic ---
  // This avoids re-running the filter logic on every render. It only runs when
  // the source orders or a filter value changes. This removes the need for a
  // separate `filteredOrders` state and an expensive `useEffect`.
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const statusMatch = !statusFilter || order.status === statusFilter;
      const userMatch = !userFilter || order.userId === userFilter;
      const dateMatch =
        !dateFilter ||
        order.deliveryDate.toDate().toDateString() === dateFilter.toDateString();
      return statusMatch && userMatch && dateMatch;
    });
  }, [orders, statusFilter, userFilter, dateFilter]);

  // --- Optimistic UI Update for Status Change ---
  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    Alert.alert('Confirm Status Update', `Change status to "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          // --- Optimistic Update: Update local state immediately for a snappy UI ---
          const originalOrders = [...orders];
          setOrders((currentOrders) =>
            currentOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
          );

          try {
            // --- Update Firestore in the background ---
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
            Toast.show({ type: 'success', text1: 'Status updated successfully!' });
          } catch (error) {
            console.error('Error updating status:', error);
            // --- If the update fails, revert the local state ---
            setOrders(originalOrders);
            Toast.show({ type: 'error', text1: 'Failed to update status.' });
          }
        },
      },
    ]);
  };
  
  // --- Export Logic ---
  const exportToExcel = async () => {
    if (filteredOrders.length === 0) {
      Toast.show({type: 'info', text1: 'No orders to export.'});
      return;
    }
    const dataToExport = filteredOrders.map((order) => {
      const user = userMap.get(order.userId);
      return {
        'Order ID': order.id,
        'Customer': user?.name || 'N/A',
        'Customer Phone': user?.phone || 'N/A',
        'Product': order.productName,
        'Quantity': `${order.quantity} ${order.unit}`,
        'Total Price': order.totalPrice,
        'Status': order.status,
        'Order Date': format(order.orderedAt.toDate(), 'yyyy-MM-dd HH:mm'),
        'Delivery Date': format(order.deliveryDate.toDate(), 'yyyy-MM-dd'),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + 'orders.xlsx';
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Orders Data',
    });
  };
  
  const clearFilters = () => {
    setStatusFilter(null);
    setUserFilter(null);
    setDateFilter(null);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#1e40af" />
        <Text className="mt-2 text-gray-500">Loading Orders...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* --- Filter Section --- */}
      <View className="space-y-2 bg-white p-3 shadow-sm">
        <View className="flex-row items-center justify-between">
           <Text className="text-lg font-bold text-gray-800">Filters</Text>
           <TouchableOpacity onPress={clearFilters}>
             <Text className="text-sm font-semibold text-blue-600">Clear All</Text>
           </TouchableOpacity>
        </View>
       
        <View className="flex-row space-x-2">
           {/* Date Filter */}
           <View className="flex-1">
             <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="rounded-md border border-gray-300 bg-white p-2.5 text-center">
              <Text className="text-center font-medium text-gray-700">
                {dateFilter ? format(dateFilter, 'dd MMM yyyy') : 'By Date'}
              </Text>
            </TouchableOpacity>
           </View>

          {/* Status Filter */}
          <View className="flex-1 rounded-md border border-gray-300 bg-white">
            <Picker
              selectedValue={statusFilter}
              onValueChange={(itemValue) => setStatusFilter(itemValue)}
              style={{ marginVertical: -8 }} // Minor style adjustment for better alignment
            >
              <Picker.Item label="By Status" value={null} />
              <Picker.Item label="Pending" value="pending" />
              <Picker.Item label="Processing" value="processing" />
              <Picker.Item label="Shipped" value="shipped" />
              <Picker.Item label="Delivered" value="delivered" />
              <Picker.Item label="Cancelled" value="cancelled" />
            </Picker>
          </View>
        </View>

        {/* User Filter */}
        <View className="rounded-md border border-gray-300 bg-white">
          <Picker
            selectedValue={userFilter}
            onValueChange={(itemValue) => setUserFilter(itemValue)}
            style={{ marginVertical: -8 }}
          >
            <Picker.Item label="All Users" value={null} />
            {users.map((user) => (
              <Picker.Item key={user.id} label={user.name || user.phone || 'N/A'} value={user.id} />
            ))}
          </Picker>
        </View>
      </View>
      
       {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={dateFilter || new Date()}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDateFilter(selectedDate);
          }}
        />
      )}

      {/* --- Orders List --- */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            item={item}
            user={userMap.get(item.userId)}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="mt-20 items-center justify-center">
            <Text className="text-lg font-semibold text-gray-600">No Orders Found</Text>
            <Text className="mt-1 text-gray-400">Try adjusting your filters.</Text>
          </View>
        }
      />
      
      {/* --- Floating Action Buttons --- */}
      <View className="absolute bottom-6 right-6 flex-row space-x-3">
        <TouchableOpacity
          onPress={exportToExcel}
          className="h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg">
          <Text className="font-bold text-white text-lg">XLS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddOrder')}
          className="h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg">
          <Text className="text-3xl font-bold text-white">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}