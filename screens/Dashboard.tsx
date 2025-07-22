import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { DashboardStackParamList } from '../types/navigation';
import { OrderStatus, User } from '../types/interfaces'; // Ensure User is also imported
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
type DashboardScreenProp = NativeStackNavigationProp<DashboardStackParamList>;

export default function Dashboard() {
  const navigation = useNavigation<DashboardScreenProp>();

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  // New state for today's orders
  const [todaysDeliveries, setTodaysDeliveries] = useState<Order[]>([]);
  const [todaysOrders, setTodaysOrders] = useState<Order[]>([]);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    // Listener for total products
    const productUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      setTotalProducts(snapshot.size);
    });

    // Listener for total users and create a map
    const userUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTotalUsers(snapshot.size);
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[];

      // ✅ DEFINITIVE FIX: Use .reduce() for a type-safe way to build the map.
      // This is clearer to TypeScript and guarantees the key is a string.
      const newMap = users.reduce((map, user) => {
        if (user.id) {
          // Ensure the user has an ID
          map.set(user.id, user);
        }
        return map;
      }, new Map<string, User>());

      setUserMap(newMap);
    });

    // Listener for orders to calculate all stats
    const orderUnsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const fetchedOrders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[];
      const earnings = fetchedOrders.reduce((sum, order) => sum + order.totalPrice, 0);

      setTotalOrders(snapshot.size);
      setTotalEarnings(earnings);

      // Filter for today's orders
      const today = new Date().toDateString();
      const deliveries = fetchedOrders.filter(
        (order) => order.deliveryDate.toDate().toDateString() === today
      );
      const newOrders = fetchedOrders.filter(
        (order) => order.orderedAt.toDate().toDateString() === today
      );

      setTodaysDeliveries(deliveries);
      setTodaysOrders(newOrders);
    });

    // Cleanup listeners on component unmount
    return () => {
      productUnsub();
      userUnsub();
      orderUnsub();
    };
  }, []);

  const renderOrderListItem = (order: Order) => (
    <View key={order.id} style={styles.orderCard}>
      <View>
        <Text style={styles.orderProduct}>{order.productName}</Text>
        <Text style={styles.orderUser}>
          For: {userMap.get(order.userId)?.name || 'Unknown User'}
        </Text>
      </View>
      <Text style={styles.orderStatus}>{order.status}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>

      {/* 2x2 Grid for Statistics */}
      <View style={styles.grid}>
        {/* Total Products Stat Box */}
        <View style={[styles.statBox, { backgroundColor: '#3b82f6', shadowColor: '#1d4ed8' }]}>
          <Text style={styles.statBoxIcon}>📦</Text>
          <Text style={styles.statBoxTitle}>Total Products</Text>
          <Text style={styles.statBoxValue}>{totalProducts}</Text>
        </View>

        {/* Total Users Stat Box */}
        <View style={[styles.statBox, { backgroundColor: '#10b981', shadowColor: '#047857' }]}>
          <Text style={styles.statBoxIcon}>👥</Text>
          <Text style={styles.statBoxTitle}>Total Users</Text>
          <Text style={styles.statBoxValue}>{totalUsers}</Text>
        </View>

        {/* Total Orders Stat Box */}
        <View style={[styles.statBox, { backgroundColor: '#f97316', shadowColor: '#c2410c' }]}>
          <Text style={styles.statBoxIcon}>📈</Text>
          <Text style={styles.statBoxTitle}>Total Orders</Text>
          <Text style={styles.statBoxValue}>{totalOrders}</Text>
        </View>

        {/* Total Earnings Stat Box */}
        <View style={[styles.statBox, { backgroundColor: '#ef4444', shadowColor: '#b91c1c' }]}>
          <Text style={styles.statBoxIcon}>💰</Text>
          <Text style={styles.statBoxTitle}>Total Earnings</Text>
          <Text style={styles.statBoxValue}>₹{totalEarnings.toFixed(2)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: '#2563eb' }]}
          onPress={() => navigation.navigate('AddProduct')}>
          <Text style={styles.actionButtonText}>+ Add Product</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: '#16a34a' }]}
          onPress={() => navigation.navigate('AddOrder')}>
          <Text style={styles.actionButtonText}>🛒 Add Order</Text>
        </Pressable>
      </View>

      {/* Today's Deliveries Section */}
      <View style={styles.sectionContainer}>
        <View className="flex-1 flex-row justify-between">
          <Text style={styles.sectionHeader}>Today's Deliveries</Text>
          <Text style={styles.sectionHeader}>{todaysDeliveries.length} </Text>
        </View>
        {todaysDeliveries.length > 0 ? (
          todaysDeliveries.map(renderOrderListItem)
        ) : (
          <Text style={styles.emptyListText}>No deliveries scheduled for today.</Text>
        )}
      </View>

      {/* Today's New Orders Section */}
      <View style={styles.sectionContainer}>
        <View className="flex-1 flex-row justify-between">
          <Text style={styles.sectionHeader}>Today's New Orders</Text>
          <Text style={styles.sectionHeader}>{todaysOrders.length}</Text>
        </View>
        {todaysOrders.length > 0 ? (
          todaysOrders.map(renderOrderListItem)
        ) : (
          <Text style={styles.emptyListText}>No new orders placed today.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginVertical: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxIcon: {
    fontSize: 32,
  },
  statBoxTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  statBoxValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 32, // Increased margin
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  orderUser: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#64748b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  emptyListText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
