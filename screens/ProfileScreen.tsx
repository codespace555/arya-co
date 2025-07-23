import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { doc, getDoc, collection, query, where, getCountFromServer } from "@react-native-firebase/firestore";
import { db, authInstance as auth } from "../services/firebase";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather"; // Using Feather icons

interface UserProfile {
  name?: string;
  phone?: string;
}

// Define the background color as a constant
const BG_COLOR = "#010409";
const PRIMARY_TEXT_COLOR = "#E6EDF3";
const SECONDARY_TEXT_COLOR = "#8B949E";
const ACCENT_COLOR = "#238636"; // A nice green accent for the dark theme

export default function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  const userId = auth.currentUser?.uid ; // fallback for testing

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUserAndOrders = async () => {
      try {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists) {
          const userData = userDoc.data() as UserProfile;
          setUser({
            name: userData.name ?? "No Name",
            phone: userData.phone ?? auth.currentUser?.email ?? "phone",
          });
        } else {
          // Fallback to auth data if no Firestore document
          setUser({
            name: auth.currentUser?.displayName || "Anonymous User",
            phone: auth.currentUser?.email || "No Email Provided",
          });
        }

        // Fetch order count
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
      <View style={{ backgroundColor: BG_COLOR }} className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={{ backgroundColor: BG_COLOR }} className="flex-1 justify-center items-center px-6">
        <Icon name="alert-triangle" size={48} color={SECONDARY_TEXT_COLOR} />
        <Text style={{ color: PRIMARY_TEXT_COLOR }} className="text-lg text-center mt-4">
          Please log in to view your profile.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: BG_COLOR }} className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="light-content" />
      
      {/* --- Header --- */}
      <View className="px-5 pt-12 pb-6">
        <Text style={{ color: PRIMARY_TEXT_COLOR }} className="text-4xl font-bold tracking-tight">Profile</Text>
      </View>
      
      {/* --- Profile Info Card --- */}
      <View className="mx-4 p-6 rounded-2xl" style={{ backgroundColor: '#0D1117', borderColor: '#30363D', borderWidth: 1 }}>
        <View className="flex-row items-center mb-6">
          <View className="p-4 rounded-full" style={{ backgroundColor: 'rgba(35, 134, 54, 0.2)'}}>
            <Icon name="user" size={28} color={ACCENT_COLOR} />
          </View>
          <View className="ml-5">
            <Text style={{ color: PRIMARY_TEXT_COLOR }} className="text-2xl font-bold">{user?.name}</Text>
            <Text style={{ color: SECONDARY_TEXT_COLOR }} className="text-base">{user?.phone}</Text>
          </View>
        </View>

        {/* --- View Orders Button --- */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Orders" as never)}
          style={{ backgroundColor: ACCENT_COLOR }}
          className="flex-row items-center justify-center rounded-lg py-3.5 mt-4"
        >
          <Icon name="shopping-bag" size={20} color="#fff" />
          <Text className="text-white text-center text-base font-semibold ml-2">View My Orders</Text>
        </TouchableOpacity>
      </View>

      {/* --- Order Summary Card --- */}
      <View className="mx-4 mt-8 p-6 rounded-2xl" style={{ backgroundColor: '#0D1117', borderColor: '#30363D', borderWidth: 1 }}>
        <View className="flex-row items-center mb-4">
          <Icon name="package" size={24} color={SECONDARY_TEXT_COLOR} />
          <Text style={{ color: PRIMARY_TEXT_COLOR }} className="text-xl font-bold ml-3">Order Summary</Text>
        </View>
        
        <View className="flex-row justify-between items-center mt-2">
          <Text style={{ color: SECONDARY_TEXT_COLOR }} className="text-lg">Total Orders Placed</Text>
          <View style={{ backgroundColor: '#21262D' }} className="rounded-full h-10 w-10 items-center justify-center">
            <Text style={{ color: PRIMARY_TEXT_COLOR }} className="font-bold text-lg">{orderCount ?? 0}</Text>
          </View>
        </View>
      </View>
      
      {/* --- Other Options --- */}
      <View className="mx-4 mt-8">
        {/* <TouchableOpacity className="flex-row items-center p-4 rounded-lg mb-3" style={{ backgroundColor: '#0D1117' }}>
           <Icon name="settings" size={22} color={SECONDARY_TEXT_COLOR} />
           <Text style={{color: PRIMARY_TEXT_COLOR}} className="text-lg ml-4">Settings</Text>
           <View className="flex-1 items-end">
             <Icon name="chevron-right" size={22} color={SECONDARY_TEXT_COLOR} />
           </View>
        </TouchableOpacity> */}
        {/* <TouchableOpacity className="flex-row items-center p-4 rounded-lg" style={{ backgroundColor: '#0D1117' }}>
           <Icon name="log-out" size={22} color="#F85149" />
           <Text style={{color: "#F85149"}} className="text-lg ml-4">Logout</Text>
        </TouchableOpacity> */}
      </View>
    </ScrollView>
  );
}