import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { RouteProp, useRoute } from "@react-navigation/native";
import { DashboardStackParamList } from "../types/navigation";
import { User, OrderStatus } from "../types/interfaces"; // Assuming types are in interfaces
import Toast from "react-native-toast-message";
import Icon from 'react-native-vector-icons/Ionicons';

type UserOrdersRouteProp = RouteProp<DashboardStackParamList, "UserOrders">;
interface Order {
  id: string;
  userId: string;
  productName: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  status: OrderStatus;
  orderedAt: { toDate: () => Date };
  deliveryDate: { toDate: () => Date };
}
// --- Color and Style mapping for Order Status ---
const statusConfig: { [key in OrderStatus]: { color: string; icon: string } } = {
    pending: { color: '#F59E0B', icon: 'hourglass-outline' },
    processing: { color: '#3B82F6', icon: 'sync-circle-outline' },
    shipped: { color: '#8B5CF6', icon: 'airplane-outline' },
    delivered: { color: '#10B981', icon: 'checkmark-circle-outline' },
    cancelled: { color: '#EF4444', icon: 'close-circle-outline' },
};

// --- Animated Order Card Component ---
const OrderCard = ({ item, index, onStatusUpdate }: { item: Order, index: number, onStatusUpdate: (id: string, status: OrderStatus) => void }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }).start();
        Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 100, useNativeDriver: true }).start();
    }, [fadeAnim, slideAnim, index]);

    const availableStatuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.orderCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.productName}>{item.productName}</Text>
                    <Text style={styles.orderDate}>{item.orderedAt?.toDate().toLocaleDateString()}</Text>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.detailText}>Quantity: {item.quantity}</Text>
                    <Text style={styles.detailText}>Total: ₹{item.totalPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.cardFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig[item.status as OrderStatus]?.color || '#6B7280' }]}>
                        <Icon name={statusConfig[item.status as OrderStatus]?.icon || 'help-circle-outline'} size={14} color="#fff" />
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>
                <View style={styles.actionsContainer}>
                    {availableStatuses.map(status => (
                        item.status !== status && (
                            <TouchableOpacity key={status} style={[styles.actionButton, {borderColor: statusConfig[status].color}]} onPress={() => onStatusUpdate(item.id, status)}>
                                <Icon name={statusConfig[status].icon} size={16} color={statusConfig[status].color} />
                                <Text style={[styles.actionButtonText, {color: statusConfig[status].color}]}>{status}</Text>
                            </TouchableOpacity>
                        )
                    ))}
                </View>
            </View>
        </Animated.View>
    );
};


export default function UserOrdersScreen() {
  const route = useRoute<UserOrdersRouteProp>();
  const { userId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the specific user's details
    const fetchUserData = async () => {
      if (!userId) return;
      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ id: userDoc.id, ...userDoc.data() } as User);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchOrders = async () => {
      if (!userId) return;
      try {
        const q = query(collection(db, "orders"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        // Sort by date client-side
        data.sort((a, b) => b.orderedAt.toDate().getTime() - a.orderedAt.toDate().getTime());
        setOrders(data);
      } catch (error) {
        console.error("Error fetching user orders:", error);
      }
    };

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([fetchUserData(), fetchOrders()]);
        setLoading(false);
    }
    
    loadAllData();
  }, [userId]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    Alert.alert(
      "Confirm Status Update",
      `Are you sure you want to update the status to "${newStatus}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            const originalOrders = [...orders];
            // Optimistic UI update
            setOrders(currentOrders => currentOrders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
            try {
              await updateDoc(doc(db, "orders", orderId), { status: newStatus });
              Toast.show({ type: "success", text1: "Status updated successfully!" });
            } catch (error) {
              console.error("Error updating status:", error);
              setOrders(originalOrders); // Revert on failure
              Toast.show({ type: "error", text1: "Failed to update status." });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{user?.name || 'User'}'s Orders</Text>
        <Text style={styles.headerSubtitle}>{user?.phone || 'No contact info'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <OrderCard item={item} index={index} onStatusUpdate={handleStatusUpdate} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found for this user.</Text>
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
  headerContainer: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#1C2128',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c9d1d9',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8b949e',
    textAlign: 'center',
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: '#1C2128',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c9d1d9',
    flex: 1,
  },
  orderDate: {
    fontSize: 12,
    color: '#8b949e',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#8b949e',
  },
  cardFooter: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#30363D',
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#8b949e',
    fontSize: 16,
  },
});
