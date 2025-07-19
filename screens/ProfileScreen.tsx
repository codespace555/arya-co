import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { doc, getDoc, collection, query, where, getCountFromServer } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { useNavigation } from "@react-navigation/native";

interface UserProfile {
  name: string;
  email: string;
}

export default function UserProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  const userId = auth.currentUser?.uid || "J2Qmb9iaAnY86oEcpPfPFhUnCvg1"; // fallback for testing

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserAndOrders = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            name: userData.name || "No Name",
            email: userData.email || auth.currentUser?.email || "No Email",
          });
        } else {
          setUser({
            name: auth.currentUser?.displayName || "No Name",
            email: auth.currentUser?.email || "No Email",
          });
        }

        const ordersQuery = query(collection(db, "orders"), where("userId", "==", userId));
        const snapshot = await getCountFromServer(ordersQuery);
        setOrderCount(snapshot.data().count);
      } catch (error) {
        console.error("Error fetching profile or orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndOrders();
  }, [userId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!userId) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 px-4">
        <Text className="text-gray-600 text-base text-center">Please log in to see your profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100 px-4 pt-8 pb-20">
      {/* Profile Card */}
      <View className="bg-white rounded-xl p-6 shadow-md">
        <Text className="text-2xl font-extrabold text-gray-900 mb-6 tracking-wide">My Profile</Text>

        <View className="flex-row justify-between mb-5">
          <Text className="text-gray-500 font-semibold text-lg">Name</Text>
          <Text className="text-gray-900 font-semibold text-lg">{user?.name}</Text>
        </View>

        <View className="flex-row justify-between mb-8">
          <Text className="text-gray-500 font-semibold text-lg">Email</Text>
          <Text className="text-gray-900 font-semibold text-lg">{user?.email}</Text>
        </View>

        {/* Navigate to Orders Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Orders" as never)}
          className="bg-blue-600 rounded-xl py-3"
        >
          <Text className="text-white text-center text-lg font-semibold">View My Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Orders Summary Card */}
      <View className="bg-white rounded-xl p-6 shadow-md mt-8">
        <Text className="text-2xl font-extrabold text-gray-900 mb-6 tracking-wide">Order Summary</Text>

        <View className="flex-row justify-between items-center">
          <Text className="text-gray-500 font-semibold text-lg">Total Orders</Text>
          <View className="bg-blue-600 rounded-full px-4 py-2 min-w-[40px] items-center justify-center">
            <Text className="text-white font-bold text-lg">{orderCount ?? 0}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
