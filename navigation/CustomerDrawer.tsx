import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { auth } from "../services/firebase"; // Your firebase config
import Ionicons from "react-native-vector-icons/Ionicons";

// Import your screens
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CustomerOrdersScreen from "../screens/CustomerOrdersScreen";

const Drawer = createDrawerNavigator();

// --- COMPLETELY REDESIGNED CUSTOM DRAWER CONTENT ---
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const [showModal, setShowModal] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout Error: ", error);
      Alert.alert("Error", "Failed to log out.");
    }
  };

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props}>
        {/* New Stylish Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Menu</Text>
        </View>

        {/* Navigation Items Wrapper */}
        <View style={styles.drawerItemsContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Redesigned Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={24} color="#eab308" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Redesigned Logout Modal */}
      <Modal transparent={true} visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalText}>
              Are you sure you want to log out from the application?
            </Text>
            <View style={styles.modalButtonContainer}>
              <Pressable
                onPress={() => setShowModal(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowModal(false);
                  handleLogout();
                }}
                style={[styles.modalButton, styles.confirmButton]}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- MAIN DRAWER NAVIGATOR WITH NEW STYLING ---
export default function CustomerDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        // General screen header styling
        headerStyle: { backgroundColor: "#111827" }, // Dark header
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        // Drawer style itself
        drawerStyle: {
          backgroundColor: '#111827', // Dark background for the drawer
          width: 250,
        },
        // Styling for the active item
        drawerActiveBackgroundColor: "#374151", // Slightly lighter gray for active item
        drawerActiveTintColor: "#fff",
        // Styling for inactive items
        drawerInactiveTintColor: "#9ca3af", // Light gray for inactive text
        // **FIXED SPACING**: This styles the container for each item
        drawerItemStyle: {
          marginVertical: 5,
          borderRadius: 8,
        },
        // **FIXED SPACING**: This styles the text label itself
        drawerLabelStyle: {
          marginLeft: -10, // Adjust this to get the perfect space
          fontSize: 15,
          fontWeight: '500',
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          drawerIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "My Profile",
          drawerIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Orders"
        component={CustomerOrdersScreen}
        options={{
          title: "My Orders",
          drawerIcon: ({ color }) => (
            <Ionicons name="receipt-outline" size={22} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

// --- NEW STYLESHEET FOR THE MODERN DESIGN ---
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#111827', // Dark background
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  drawerItemsContainer: {
    paddingTop: 10,
  },
  footer: {
    borderTopColor: "#374151",
    borderTopWidth: 1,
    padding: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(234, 179, 8, 0.1)', // Subtle yellow background
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    marginLeft: 15, // Perfect gap between icon and text
    color: "#eab308", // Yellow text to match icon
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#1f2937", // Dark modal
    padding: 24,
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: '#fff',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: '#d1d5db',
    lineHeight: 24,
  },
  modalButtonContainer: {
    flexDirection: "row",
    gap: 15,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: '#4b5563',
  },
  cancelButtonText: {
    color: '#fff',
  },
  confirmButton: {
    backgroundColor: "#eab308",
  },
  buttonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "bold",
  },
});