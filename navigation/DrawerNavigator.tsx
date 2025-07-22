import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { auth } from '../services/firebase'; // Correct path to your firebase config

// --- Icon Library ---
import Icon from 'react-native-vector-icons/Ionicons';

// --- Type Definitions ---
import { DashboardStackParamList, DrawerParamList } from '../types/navigation';

// --- Screen Imports ---
import ProductList from '../screens/ProductList';
import OrdersScreen from '../screens/OrdersScreen';
import UsersScreen from '../screens/UsersScreen';
import AddProductScreen from '../screens/AddProductScreen';
import UserOrdersScreen from '../screens/UserOrdersScreen';
import AddOrderScreen from '../screens/AddOrderScreen';
import Dashboard from '../screens/Dashboard';

const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createNativeStackNavigator<DashboardStackParamList>();

// --- Logout Handler ---
const handleLogout = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Logout Error: ", error);
    Alert.alert("Error", "Failed to log out.");
  }
};

// --- Custom Drawer Component (Black and Blue Theme) ---
function CustomDrawerContent(props: any) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Use onAuthStateChanged to get the current user's email reliably
    const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
            setUserEmail(user.email);
        } else {
            setUserEmail(null);
        }
    });
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D1117' }}>
      <DrawerContentScrollView {...props}>
        {/* Drawer Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.avatar}>
            <Icon name="person-circle-outline" size={50} color="#A5B4FC" />
          </View>
          <Text style={styles.drawerHeaderText}>Admin Panel</Text>
          <Text style={styles.drawerHeaderEmail}>{userEmail || 'No user logged in'}</Text>
        </View>
        {/* Navigation Items */}
        <View style={styles.drawerItemsContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="log-out-outline" size={22} color="#9CA3AF" />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

// --- Stack Navigator for screens inside Dashboard ---
function DashboardStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1C2128' }, // Dark Header
        headerTintColor: '#c9d1d9', // Light text
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={Dashboard}
        options={({ navigation }) => ({
            title: 'Dashboard',
            headerLeft: () => (
                <Pressable onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={{ marginLeft: 10 }}>
                    <Icon name="menu" size={30} color="#c9d1d9" />
                </Pressable>
            ),
        })}
      />
      <Stack.Screen 
        name="AddProduct" 
        component={AddProductScreen} 
        options={{ title: 'Dashboard > Add Product' }} 
      />
      <Stack.Screen 
        name="UserOrders" 
        component={UserOrdersScreen} 
        options={{ title: 'Dashboard > User Orders' }} 
      />
      <Stack.Screen 
        name="AddOrder" 
        component={AddOrderScreen} 
        options={{ title: 'Dashboard > Add Order' }} 
      />
    </Stack.Navigator>
  );
}

// --- Main Drawer Navigator ---
export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
            backgroundColor: '#0D1117', // Black background for the whole drawer
        },
        drawerActiveBackgroundColor: '#4F46E5', // Vibrant blue for active item
        drawerActiveTintColor: '#FFFFFF', // White text for active item
        drawerInactiveTintColor: '#9CA3AF', // Gray text for inactive items
        drawerItemStyle: {
          marginVertical: 5,
          borderRadius: 8,
        },
        drawerLabelStyle: {
          marginLeft: -10, // Spacing between icon and text
          fontSize: 15,
          fontWeight: '500',
        },
        headerStyle: { backgroundColor: '#1C2128' }, // Match Stack header
        headerTintColor: '#c9d1d9', // Match Stack header text
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          title: 'Dashboard',
          headerShown: false, // Correct, header is managed by the Stack
          drawerIcon: ({ color }) => <Icon name="home-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Products"
        component={ProductList}
        options={{
          title: 'Products',
          drawerIcon: ({ color }) => <Icon name="cube-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Orderslist"
        component={OrdersScreen}
        options={{
          title: 'All Orders',
          drawerIcon: ({ color }) => <Icon name="cart-outline" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Users"
        component={UsersScreen}
        options={{
          title: 'Manage Users',
          drawerIcon: ({ color }) => <Icon name="people-outline" size={22} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

// --- Styles for Custom Drawer ---
const styles = StyleSheet.create({
  drawerHeader: {
    backgroundColor: '#1C2128', // Dark blue-gray background
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  avatar: {
    marginBottom: 10,
  },
  drawerHeaderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawerHeaderEmail: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  drawerItemsContainer: {
    backgroundColor: '#0D1117', // Black background
    paddingTop: 10,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#30363D', // Darker separator
  },
  logoutButton: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 15,
    marginLeft: 10,
    color: '#9CA3AF', // Gray text
    fontWeight: '600',
  },
});
