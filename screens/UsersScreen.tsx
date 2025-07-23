import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
} from "react-native";
import { collection, getDocs } from "@react-native-firebase/firestore";
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
} from "../types/navigation";
import { User } from "../types/interfaces"; // Assuming User type is defined here
import Icon from 'react-native-vector-icons/Ionicons';

// Combine Drawer and Stack navigation for type safety
type NavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, "Dashboard">,
  NativeStackNavigationProp<DashboardStackParamList>
>;

// --- Animated User Card Component ---
const UserCard = ({ item, index, onNavigate }: { item: User, index: number, onNavigate: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100, // Stagger animation
      useNativeDriver: true,
    }).start();
    Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
            <View style={styles.avatar}>
                <Icon name="person-outline" size={24} color="#A5B4FC" />
            </View>
            <View>
                <Text style={styles.userName}>{item.name || "No Name"}</Text>
                <Text style={styles.userPhone}>{item.phone || "No Phone Number"}</Text>
            </View>
        </View>
        <TouchableOpacity style={styles.viewButton} onPress={onNavigate}>
            <Text style={styles.viewButtonText}>View Orders</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// --- Main Users Screen Component ---
export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    // This filter correctly ensures that any user in the list has a valid ID.
    const validUsers = users.filter(user => user && user.id);

    if (!searchQuery) {
      return validUsers;
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    return validUsers.filter(user =>
      user.name?.toLowerCase().includes(lowercasedQuery) ||
      user.phone?.toLowerCase().includes(lowercasedQuery)
    );
  }, [users, searchQuery]);

  const handleNavigateToUserOrders = (userId: string) => {
    navigation.navigate("Dashboard", {
      screen: "UserOrders",
      params: { userId },
    } as never);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#8b949e" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor="#8b949e"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          // ✅ FIX: Added non-null assertion (!) to assure TypeScript that item.id is a string.
          keyExtractor={(item) => item.id!}
          renderItem={({ item, index }) => (
            <UserCard 
                item={item} 
                index={index}
                // ✅ FIX: Added non-null assertion (!) here as well for type safety.
                onNavigate={() => handleNavigateToUserOrders(item.id!)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117', // Black background
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2128', // Dark blue-gray
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#c9d1d9', // Light text
    fontSize: 16,
  },
  userCard: {
    backgroundColor: '#1C2128', // Dark blue-gray
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#30363D', // Lighter blue-gray
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c9d1d9', // Off-white text
  },
  userPhone: {
    fontSize: 14,
    color: '#8b949e', // Gray text
    marginTop: 2,
  },
  viewButton: {
    backgroundColor: '#4F46E5', // Vibrant blue
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#8b949e', // Gray text
    fontSize: 16,
  },
});
