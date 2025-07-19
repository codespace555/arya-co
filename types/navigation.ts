import { NavigatorScreenParams } from "@react-navigation/native";
import { Product } from '../screens/ProductList';

export type DashboardStackParamList = {
  AddProduct: { product?: Product } | undefined;
  UserOrders: { userId: string };
  AddOrder: undefined;
};

export type DrawerParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orderslist: undefined;
  Users: undefined;
};

// ✅ Declare Customer Drawer Param List
export type CustomerDrawerParamList = {
  Home: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: { uid: string };
  Main: NavigatorScreenParams<DrawerParamList>; // Admin
  Arya: NavigatorScreenParams<CustomerDrawerParamList>; // Customer
};

// Optional — If you need this prop for useNavigation or linking
export type RootStackNavigationProp = NavigatorScreenParams<RootStackParamList>;
