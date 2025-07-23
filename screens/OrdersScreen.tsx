import React, { useEffect, useMemo, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, TextInput, StyleSheet, Alert, Animated } from 'react-native';
import { collection, doc, getDocs, orderBy, query, updateDoc } from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';

// Local Imports
import { db } from '../services/firebase'; // Your firebase config
import { User, OrderStatus } from '../types/interfaces'; // Using your types file
import { FilterModal } from '../components/FilterModal'; // Assuming FilterModal is styled separately

// Navigation Imports
import { StackNavigationProp } from '@react-navigation/stack';
import { DashboardStackParamList } from '../types/navigation'; // Your navigation types

// Centralized Order interface
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

// --- Color and Style mapping for Order Status ---
const statusConfig: { [key in OrderStatus]: { color: string; icon: string } } = {
    pending: { color: '#F59E0B', icon: 'hourglass-outline' },
    processing: { color: '#3B82F6', icon: 'sync-circle-outline' },
    shipped: { color: '#8B5CF6', icon: 'airplane-outline' },
    delivered: { color: '#10B981', icon: 'checkmark-circle-outline' },
    cancelled: { color: '#EF4444', icon: 'close-circle-outline' },
};

// --- Styled OrderCard Component (defined in this file for a complete UI) ---
const OrderCard = ({ item, user, onStatusUpdate, index }: { item: Order; user: User | undefined; onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void; index: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim, index]);

    const availableStatuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.orderCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.cardUser}>{user?.name || 'Unknown User'}</Text>
                        <Text style={styles.cardProduct}>{item.productName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig[item.status]?.color || '#6B7280' }]}>
                        <Icon name={statusConfig[item.status]?.icon || 'help-circle-outline'} size={14} color="#fff" />
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.detailText}>Qty: {item.quantity} {item.unit}</Text>
                    <Text style={styles.priceText}>₹{item.totalPrice.toFixed(2)}</Text>
                </View>
                {/* ✅ FIX: Added status update buttons section */}
                <View style={styles.actionsContainer}>
                    {availableStatuses.map(status => (
                        item.status !== status && (
                            <TouchableOpacity key={status} style={[styles.actionButton, {borderColor: statusConfig[status].color}]} onPress={() => onStatusUpdate(item.id, status)}>
                                <Icon name={statusConfig[status].icon} size={16} color={statusConfig[status].color} />
                            </TouchableOpacity>
                        )
                    ))}
                </View>
            </View>
        </Animated.View>
    );
};


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

  const userMap = useMemo(() => new Map(users.map(user => user.id ? [user.id, user] : []) as [string, User][]), [users]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const lowercasedQuery = searchQuery.toLowerCase().trim();
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

  // ✅ FIX: Implemented the export to excel functionality
  const exportToExcel = async () => {
    if (filteredOrders.length === 0) {
      Toast.show({ type: 'info', text1: 'No data to export.' });
      return;
    }
    try {
      Toast.show({ type: 'info', text1: 'Generating Excel file...' });
      const dataToExport = filteredOrders.map(order => ({
        'Customer': userMap.get(order.userId)?.name || 'N/A',
        'Phone': userMap.get(order.userId)?.phone || 'N/A',
        'Product': order.productName,
        'Quantity': order.quantity,
        'Unit': order.unit,
        'Total Price': order.totalPrice,
        'Status': order.status,
        'Order Date': format(order.orderedAt.toDate(), 'yyyy-MM-dd HH:mm'),
        'Delivery Date': format(order.deliveryDate.toDate(), 'yyyy-MM-dd'),
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'orders.xlsx';
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Export Orders Data' });
    } catch (error) {
      console.error("Export Error:", error);
      Toast.show({ type: 'error', text1: 'Export Failed', text2: 'Could not create or share the file.' });
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.searchBar}>
            <Icon name="search-outline" size={20} color="#8b949e" />
            <TextInput 
                placeholder="Search Orders..." 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                style={styles.searchInput}
                placeholderTextColor="#8b949e"
            />
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => setFilterModalVisible(true)}>
            <Icon name="filter-outline" size={22} color="#c9d1d9" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={exportToExcel}>
            <Icon name="download-outline" size={22} color="#c9d1d9" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <OrderCard item={item} user={userMap.get(item.userId)} onStatusUpdate={handleStatusUpdate} index={index} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No Orders Found</Text></View>}
      />

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

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#0D1117' },
  headerContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#1C2128', borderBottomWidth: 1, borderBottomColor: '#30363D', alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1117', borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#30363D' },
  searchInput: { flex: 1, height: 40, fontSize: 15, color: '#c9d1d9', marginLeft: 8 },
  iconButton: { marginLeft: 10, padding: 8, backgroundColor: '#1C2128', borderRadius: 10, borderWidth: 1, borderColor: '#30363D' },
  emptyText: { fontSize: 16, color: '#8b949e' },
  // Order Card Styles
  orderCard: {
    backgroundColor: '#1C2128',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c9d1d9',
  },
  cardProduct: {
    fontSize: 14,
    color: '#8b949e',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#30363D',
    marginBottom: 12, // Add margin to separate from actions
  },
  detailText: {
    fontSize: 14,
    color: '#8b949e',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c9d1d9',
  },
  // New styles for action buttons
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#30363D',
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20, // Make it a pill shape
    marginRight: 8,
    marginBottom: 8,
  },
});
