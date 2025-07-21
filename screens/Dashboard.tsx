import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { DashboardStackParamList } from '../types/navigation';
import { Order } from '../types/interfaces';

type DashboardScreenProp = NativeStackNavigationProp<DashboardStackParamList>;

export default function Dashboard() {
  const navigation = useNavigation<DashboardScreenProp>();

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    // Listener for total products
    const productUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      setTotalProducts(snapshot.size);
    });

    // Listener for total users
    const userUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTotalUsers(snapshot.size);
    });

    // Listener for orders to calculate total orders and earnings
    const orderUnsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => doc.data()) as Order[];
        const earnings = fetchedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        
        setTotalOrders(snapshot.size);
        setTotalEarnings(earnings);
    });

    // Cleanup listeners on component unmount
    return () => {
      productUnsub();
      userUnsub();
      orderUnsub();
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>
      
      {/* 2x2 Grid for Statistics */}
      <View style={styles.grid}>
        {/* Total Products Stat Box */}
        <View style={[styles.statBox, { backgroundColor: "#3b82f6", shadowColor: "#1d4ed8" }]}>
          <Text style={styles.statBoxIcon}>📦</Text>
          <Text style={styles.statBoxTitle}>Total Products</Text>
          <Text style={styles.statBoxValue}>{totalProducts}</Text>
        </View>

        {/* Total Users Stat Box */}
        <View style={[styles.statBox, { backgroundColor: "#10b981", shadowColor: "#047857" }]}>
          <Text style={styles.statBoxIcon}>👥</Text>
          <Text style={styles.statBoxTitle}>Total Users</Text>
          <Text style={styles.statBoxValue}>{totalUsers}</Text>
        </View>

        {/* Total Orders Stat Box */}
        <View style={[styles.statBox, { backgroundColor: "#f97316", shadowColor: "#c2410c" }]}>
          <Text style={styles.statBoxIcon}>📈</Text>
          <Text style={styles.statBoxTitle}>Total Orders</Text>
          <Text style={styles.statBoxValue}>{totalOrders}</Text>
        </View>

        {/* Total Earnings Stat Box */}
        <View style={[styles.statBox, { backgroundColor: "#ef4444", shadowColor: "#b91c1c" }]}>
          <Text style={styles.statBoxIcon}>💰</Text>
          <Text style={styles.statBoxTitle}>Total Earnings</Text>
          <Text style={styles.statBoxValue}>${totalEarnings.toFixed(2)}</Text>
        </View>
      </View>

       {/* Action Buttons */}
       <View style={styles.buttonContainer}>
            <Pressable style={[styles.actionButton, {backgroundColor: '#2563eb'}]} onPress={() => navigation.navigate('AddProduct')}>
                <Text style={styles.actionButtonText}>+ Add Product</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, {backgroundColor: '#16a34a'}]} onPress={() => navigation.navigate('AddOrder')}>
                <Text style={styles.actionButtonText}>🛒 Add Order</Text>
            </Pressable>
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
    marginBottom: 24, // Add some space after the grid
  },
  statBox: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6, // Increased elevation for a more pronounced shadow
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxIcon: {
    fontSize: 32, // Larger icon size
  },
  statBoxTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12, // More space between icon and title
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
    marginBottom: 48,
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
  }
});
