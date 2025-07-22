import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { DashboardStackParamList } from '../types/navigation';
import {  OrderStatus, User } from '../types/interfaces'; // Ensure User is also imported
import Icon from 'react-native-vector-icons/Ionicons';

type DashboardScreenProp = NativeStackNavigationProp<DashboardStackParamList>;
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

// --- Animated Order Card Component ---
const OrderCard = ({ order, user, index }: { order: Order, user: User | undefined, index: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim, index]);

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.orderCard}>
                <View>
                    <Text style={styles.orderProduct}>{order.productName}</Text>
                    <Text style={styles.orderUser}>For: {user?.name || 'Unknown User'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig[order.status]?.color || '#6B7280' }]}>
                  <Icon name={statusConfig[order.status]?.icon || 'help-circle-outline'} size={12} color="#fff" />
                  <Text style={styles.orderStatus}>{order.status}</Text>
                </View>
            </View>
        </Animated.View>
    );
};


export default function Dashboard() {
  const navigation = useNavigation<DashboardScreenProp>();
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [todaysDeliveries, setTodaysDeliveries] = useState<Order[]>([]);
  const [todaysOrders, setTodaysOrders] = useState<Order[]>([]);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    const productUnsub = onSnapshot(collection(db, 'products'), (snapshot) => setTotalProducts(snapshot.size));
    const userUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTotalUsers(snapshot.size);
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[];
      const newMap = users.reduce((map, user) => {
        if (user.id) map.set(user.id, user);
        return map;
      }, new Map<string, User>());
      setUserMap(newMap);
    });

    const ordersQuery = query(collection(db, 'orders'), orderBy('orderedAt', 'desc'));
    const orderUnsub = onSnapshot(ordersQuery, (snapshot) => {
      const fetchedOrders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Order[];
      const earnings = fetchedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      setTotalOrders(snapshot.size);
      setTotalEarnings(earnings);

      const today = new Date().toDateString();
      const deliveries = fetchedOrders.filter((order) => order.deliveryDate.toDate().toDateString() === today);
      const newOrders = fetchedOrders.filter((order) => order.orderedAt.toDate().toDateString() === today);
      setTodaysDeliveries(deliveries);
      setTodaysOrders(newOrders);
      setLoading(false);
    });

    return () => { productUnsub(); userUnsub(); orderUnsub(); };
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {/* 2x2 Grid for Statistics */}
      <View style={styles.grid}>
        <View style={[styles.statBox, { backgroundColor: '#4F46E5' }]}>
          <Icon name="cube-outline" size={32} color="#fff" />
          <Text style={styles.statBoxValue}>{totalProducts}</Text>
          <Text style={styles.statBoxTitle}>Total Products</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#10B981' }]}>
          <Icon name="people-outline" size={32} color="#fff" />
          <Text style={styles.statBoxValue}>{totalUsers}</Text>
          <Text style={styles.statBoxTitle}>Total Users</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#F59E0B' }]}>
          <Icon name="cart-outline" size={32} color="#fff" />
          <Text style={styles.statBoxValue}>{totalOrders}</Text>
          <Text style={styles.statBoxTitle}>Total Orders</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#EF4444' }]}>
          <Icon name="cash-outline" size={32} color="#fff" />
          <Text style={styles.statBoxValue}>₹{totalEarnings.toFixed(2)}</Text>
          <Text style={styles.statBoxTitle}>Total Earnings</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('AddProduct')}>
          <Icon name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Add Product</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => navigation.navigate('AddOrder')}>
          <Icon name="add-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Add Order</Text>
        </Pressable>
      </View>

      {/* Today's Deliveries Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Deliveries</Text>
          <Text style={styles.sectionCount}>{todaysDeliveries.length}</Text>
        </View>
        {todaysDeliveries.length > 0 ? (
          todaysDeliveries.map((order, index) => (
            <OrderCard key={order.id} order={order} user={userMap.get(order.userId)} index={index} />
          ))
        ) : (
          <Text style={styles.emptyListText}>No deliveries scheduled for today.</Text>
        )}
      </View>

      {/* Today's New Orders Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's New Orders</Text>
          <Text style={styles.sectionCount}>{todaysOrders.length}</Text>
        </View>
        {todaysOrders.length > 0 ? (
          todaysOrders.map((order, index) => (
            <OrderCard key={order.id} order={order} user={userMap.get(order.userId)} index={index} />
          ))
        ) : (
          <Text style={styles.emptyListText}>No new orders placed today.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1117',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  statBox: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  statBoxValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statBoxTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#1C2128',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363D',
    width: '48%',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#c9d1d9',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#c9d1d9',
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#30363D',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  orderCard: {
    backgroundColor: '#1C2128',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  orderProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c9d1d9',
  },
  orderUser: {
    fontSize: 14,
    color: '#8b949e',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
    marginLeft: 4,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#8b949e',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
