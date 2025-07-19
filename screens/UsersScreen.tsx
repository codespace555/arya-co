import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  DashboardStackParamList,
  DrawerParamList,
  RootStackParamList,
} from "../types/navigation";

// Combine Drawer and Stack navigation
type NavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, "Dashboard">,
  NativeStackNavigationProp<DashboardStackParamList>
>;

export default function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <View className="flex-1 bg-white px-4 py-6">
      <Text className="text-2xl font-bold text-center text-blue-700 mb-4">
        All Users
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1e40af" />
      ) : users.length === 0 ? (
        <Text className="text-center text-gray-500">No users found.</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-gray-100 p-4 rounded-lg mb-3 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900">
                {item.name || "No Name"}
              </Text>
              <Text className="text-sm text-gray-600">
                {item.phone || "No Phone"}
              </Text>

              <TouchableOpacity
                className="mt-2 bg-blue-600 px-4 py-2 rounded-xl"
                onPress={() => {
                  navigation.navigate("Dashboard", {
                    screen: "UserOrders",
                    params: { userId : item.id },
                  } as never);
                }}
              >
                <Text className="text-white text-center font-medium">
                  View Orders
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
