import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { RouteProp, useRoute } from "@react-navigation/native";
import {
  DashboardStackParamList,
  DrawerParamList,
  RootStackParamList,
} from "../types/navigation";
import { ScrollView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

type UserOrdersRouteProp = RouteProp<DashboardStackParamList, "UserOrders">;

interface Order {
  id: string;
  userId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: any;
}

export default function UserOrdersScreen() {
  const route = useRoute<UserOrdersRouteProp>();
  const { userId } = route.params
const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(
      collection(db, "orders"), 
       
       // Orders by creation date in descending order
      where("userId", "==", userId) // Filter by userId
    );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(data);
      } catch (error) {
        console.error("Error fetching user orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    fetchUsers();
  }, [userId]);

   const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name || "Unnamed" : "Unknown User";
  };
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    console.log("Attempting to update status for order:", id, "to", newStatus);

    // Show confirmation dialog
    Alert.alert(
      "Confirm Status Update",
      "Are you sure you want to update the status?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              // Ensure id and newStatus are valid before proceeding
              if (!id || !newStatus) {
                throw new Error("Invalid order id or status.");
              }

              // Update status in Firestore
              await updateDoc(doc(db, "orders", id), { status: newStatus });

              // Show success toast
              Toast.show({
                type: "success",
                text1: "Order status updated successfully",
              });

              // Refetch orders to keep the UI updated
              setOrders(
                orders.map((order) =>
                  order.id === id ? { ...order, status: newStatus } : order
                )
              );
            } catch (error) {
              console.error("Error updating status:", error);

              // Show error toast
              Toast.show({
                type: "error",
                text1: "Failed to update order status",
                text2: error instanceof Error ? error.message : "Unknown error",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };
  return (
    <View className="flex-1 bg-white px-4 py-6 ">
      <Text className="text-2xl font-bold text-blue-700 text-center mb-4">
        {getUserName(userId)} Orders
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1e40af" />
      ) : orders.length === 0 ? (
        <Text className="text-center text-gray-500 mt-4">
          No orders found for this user.
        </Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-gray-100 p-4 rounded-lg mb-3 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900">
                Product: {item.productName}
              </Text>
              <Text className="text-sm text-gray-600">
                Quantity: {item.quantity}
              </Text>
              <Text className="text-sm text-gray-600">
                Total: ₹{item.totalPrice}
              </Text>
              <Text className="text-sm text-gray-600">
                Status: {item.status}
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                {item.createdAt?.toDate().toLocaleString()}
              </Text>
              <View className="flex-row flex-wrap">
                {[
                  "pending",
                  "processing",
                  "shipped",
                  "delivered",
                  "cancelled",
                ].map((status) => (
                  <TouchableOpacity
                    key={status}
                    className="bg-blue-500 px-3 py-1 rounded mr-2 mb-2"
                    onPress={() => handleStatusUpdate(item.id, status)}
                  >
                    <Text className="text-white">{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
