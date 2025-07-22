// src/screens/OrdersScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, TextInput, StyleSheet, Alert } from 'react-native';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';

// Local Imports
import { db } from '../services/firebase'; // Your firebase config
import {  User, OrderStatus } from '../types/interfaces'; // Our new types file
import { OrderCard } from '../components/OrderCard'; // Our new OrderCard
import { FilterModal } from '../components/FilterModal'; // Our new FilterModal

// Navigation Imports
import { StackNavigationProp } from '@react-navigation/stack';
import { DashboardStackParamList } from '../types/navigation'; // Your navigation types
 interface Order {
  id: string;
  userId: string;
  productName: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  status: OrderStatus;
  orderedAt: { toDate: () => Date };
  deliveryDate: { toDate: () => Date };
}
export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  const navigation = useNavigation<StackNavigationProp<DashboardStackParamList>>();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as User[];
        setUsers(usersData);

        const ordersQuery = query(collection(db, 'orders'), orderBy('deliveryDate', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        Toast.show({ type: 'error', text1: 'Failed to load data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const userMap = useMemo(() => new Map(users.map(user => [user.id, user])), [users]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const lowercasedQuery = searchQuery.toLowerCase().trim();
      if (!statusFilter && !userFilter && !dateFilter && lowercasedQuery === '') {
          return true; // No filters active, show all
      }
      const statusMatch = !statusFilter || order.status === statusFilter;
      const userMatch = !userFilter || order.userId === userFilter;
      const dateMatch = !dateFilter || order.deliveryDate.toDate().toDateString() === dateFilter.toDateString();
      const user = userMap.get(order.userId);
      const searchMatch = lowercasedQuery === '' || (user && user.name?.toLowerCase().includes(lowercasedQuery)) || (user && user.phone?.includes(lowercasedQuery)) || order.productName.toLowerCase().includes(lowercasedQuery);
      return statusMatch && userMatch && dateMatch && searchMatch;
    });
  }, [orders, statusFilter, userFilter, dateFilter, searchQuery, userMap]);

  const handleApplyFilters = (filters: { status: any; user: any; date: any; }) => {
    setStatusFilter(filters.status);
    setUserFilter(filters.user);
    setDateFilter(filters.date);
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setUserFilter(null);
    setDateFilter(null);
    setSearchQuery('');
    setFilterModalVisible(false);
  };

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    Alert.alert('Confirm Status Change', `Are you sure you want to change the status to "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: async () => {
        const originalOrders = [...orders];
        setOrders(currentOrders => currentOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        try {
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, { status: newStatus });
          Toast.show({ type: 'success', text1: 'Status updated!' });
        } catch (error) {
          console.error("Failed to update status:", error);
          setOrders(originalOrders); // Revert on failure
          Toast.show({ type: 'error', text1: 'Update failed.' });
        }
      }},
    ]);
  };

  const exportToExcel = async () => {
    if (filteredOrders.length === 0) return Toast.show({ type: 'info', text1: 'No data to export.' });
    try {
      const dataToExport = filteredOrders.map(order => ({
        'Customer': userMap.get(order.userId)?.name || 'N/A',
        'Phone': userMap.get(order.userId)?.phone || 'N/A',
        'Product': order.productName, 'Quantity': order.quantity, 'Unit': order.unit,
        'Total Price': order.totalPrice, 'Status': order.status,
        'Order Date': format(order.orderedAt.toDate(), 'yyyy-MM-dd HH:mm'),
        'Delivery Date': format(order.deliveryDate.toDate(), 'yyyy-MM-dd'),
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'orders.xlsx';
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    } catch (error) {
      console.error("Export Error:", error);
      Toast.show({ type: 'error', text1: 'Export Failed', text2: 'Could not create or share the file.' });
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1e40af" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.searchBar}><Text>🔍</Text><TextInput placeholder="Search..." value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} /></View>
        <TouchableOpacity style={styles.iconButton} onPress={() => setFilterModalVisible(true)}><Text style={styles.iconText}>📊</Text></TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={exportToExcel}><Text style={styles.iconText}>📄</Text></TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard item={item} user={userMap.get(item.userId)} onStatusUpdate={handleStatusUpdate} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No Orders Found</Text></View>}
      />

      {/* <TouchableOpacity onPress={() => navigation.navigate('AddOrder')} style={styles.fabAdd}><Text style={styles.fabIcon}>+</Text></TouchableOpacity> */}

      <FilterModal
        isVisible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        onClear={clearFilters}
        currentFilters={{ status: statusFilter, user: userFilter, date: dateFilter }}
        users={users}
      />
    </View>
  );
}

// Add these styles at the bottom of OrdersScreen.tsx
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerContainer: { flexDirection: 'row', padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 10 },
  searchInput: { flex: 1, height: 40, fontSize: 15, color: '#111827', marginLeft: 8 },
  iconButton: { marginLeft: 10, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 10 },
  iconText: { fontSize: 20, color: '#3b82f6' },
  fabAdd: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16a34a', elevation: 4 },
  fabIcon: { fontSize: 30, color: 'white', lineHeight: 32 },
  emptyText: { fontSize: 16, color: '#6b7280' },
});