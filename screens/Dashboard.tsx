import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { auth } from "../services/firebase";
import { Modal } from "react-native-paper";
import { DashboardStackParamList } from "../types/navigation";

type DashboardScreenProp = NativeStackNavigationProp<DashboardStackParamList>;

export default function Dashboard() {
  const navigation = useNavigation<DashboardScreenProp>();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.getParent()?.navigate("Login");
    } catch (error) {
      Alert.alert("Error", "Failed to log out.");
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 py-12 h-full w-full">
      <Text className="text-3xl font-bold text-blue-700 text-center mb-8">
        Admin Dashboard
      </Text>

      {/* Add Product */}
      <TouchableOpacity
        className="bg-blue-600 p-4 rounded-2xl mb-4 shadow-md"
        onPress={() => navigation.navigate("AddProduct")}
      >
        <Text className="text-white text-lg font-semibold text-center">
          Add Product
        </Text>
      </TouchableOpacity>

      {/* Add Order */}
      <TouchableOpacity
        className="bg-green-600 p-4 rounded-2xl mb-4 shadow-md"
        onPress={() => navigation.navigate("AddOrder")}
      >
        <Text className="text-white text-lg font-semibold text-center">
          Add Order
        </Text>
      </TouchableOpacity>

      {/* View User Orders */}
      {/* <TouchableOpacity
        className="bg-yellow-500 p-4 rounded-2xl mb-4 shadow-md"
        onPress={() =>
          navigation.navigate("UserOrders", { userId: "sampleUserId" })
        }
      >
        <Text className="text-white text-lg font-semibold text-center">
          View User Orders
        </Text>
      </TouchableOpacity> */}

      {/* Logout */}
      <TouchableOpacity
        className="bg-red-600 p-4 rounded-2xl mt-8 shadow-md"
        onPress={() => setShowModal(true)}
      >
        <Text className="text-white text-lg font-semibold text-center">
          Logout
        </Text>
      </TouchableOpacity>

      {/* Logout Modal */}
      <Modal visible={showModal}>

        <View className=" ">
          <View className="bg-white  rounded-xl ">
            <Text className="text-lg font-semibold text-gray-800 m p-5">
              Are you sure you want to log out?
            </Text>

            <View className="flex-row justify-between gap-3  space-x-4">
              <Pressable
                onPress={() => {
                  setShowModal(false);
                  handleLogout();
                }}
                className="flex-1 bg-red-600 py-3 rounded-lg"
              >
                <Text className="text-white text-sm text-center font-semibold">
                  Logout
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowModal(false)}
                className="flex-1 bg-gray-400 py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
