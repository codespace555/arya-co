import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CustomerOrdersScreen from "../screens/CustomerOrdersScreen";
import { auth } from "../services/firebase";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: any) {
  const [showModal, setShowModal] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // props.navigation.reset({
      //   index: 0,
      //   routes: [{ name: "Login" }],
      // });
    } catch (error) {
      Alert.alert("Error", "Failed to log out.");
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />

      {/* Logout Button */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={{ padding: 16, marginTop: 10 }}
      >
        <Text style={{ color: "red", fontSize: 16 }}>Logout</Text>
      </TouchableOpacity>

      {/* Confirm Logout Modal */}
      <Modal transparent={true} visible={showModal} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 8,
              width: "80%",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, marginBottom: 20 }}>
              Are you sure you want to log out?
            </Text>

            <View style={{ flexDirection: "row", gap: 20 }}>
              <Pressable
                onPress={() => {
                  setShowModal(false);
                  handleLogout();
                }}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: "#dc2626",
                  borderRadius: 5,
                }}
              >
                <Text style={{ color: "#fff" }}>Logout</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowModal(false)}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: "#6b7280",
                  borderRadius: 5,
                }}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </DrawerContentScrollView>
  );
}

export default function CustomerDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: "#1e40af" },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#1e40af",
        drawerLabelStyle: { fontSize: 16 },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Orders" component={CustomerOrdersScreen} />
    </Drawer.Navigator>
  );
}
