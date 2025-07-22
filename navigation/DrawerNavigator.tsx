// DrawerNavigator.tsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  DashboardStackParamList,
  DrawerParamList
} from '../types/navigation'; // adjust import path

// Import your screen components
import ProductList from '../screens/ProductList';
import OrdersScreen from '../screens/OrdersScreen';
import UsersScreen from '../screens/UsersScreen';
import AddProductScreen from '../screens/AddProductScreen';
import UserOrdersScreen from '../screens/UserOrdersScreen';
import AddOrderScreen from '../screens/AddOrderScreen';

// --- FIX: Import the correct Dashboard component ---
// Make sure this path points to your actual Dashboard screen file
import Dashboard from '../screens/Dashboard'; 

const Drawer = createDrawerNavigator<DrawerParamList>();
const Stack = createNativeStackNavigator<DashboardStackParamList>();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }} >
      {/* This will now render the correct Dashboard component */}
      <Stack.Screen name="Dashboard" component={Dashboard} /> 
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="UserOrders" component={UserOrdersScreen} />
      <Stack.Screen name="AddOrder" component={AddOrderScreen} />
    </Stack.Navigator>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#1e40af' },
        headerTintColor: '#fff',
        drawerActiveTintColor: '#1e40af',
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ title: 'Dashboard' }}
      />
      <Drawer.Screen name="Products" component={ProductList} />
      <Drawer.Screen name="Orderslist" component={OrdersScreen} />
      <Drawer.Screen name="Users" component={UsersScreen} />
    </Drawer.Navigator>
  );
}