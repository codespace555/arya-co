import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import { db, authInstance as auth } from "../services/firebase";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { format } from "date-fns";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInUp } from "react-native-reanimated";
import Ionicons from "react-native-vector-icons/Ionicons";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- INTERFACES ---
interface Order {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
  deliveryDate: Date;
  orderedAt: Date;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
}

// --- ORDER CARD COMPONENT ---
const OrderCard = ({ order, index }: { order: Order; index: number }) => {
  const getStatusStyle = () => {
    switch (order.status) {
      case 'Delivered': return { icon: 'checkmark-circle', color: '#10b981', label: 'Delivered' };
      case 'Shipped': return { icon: 'airplane', color: '#3b82f6', label: 'Shipped' };
      case 'Cancelled': return { icon: 'close-circle', color: '#ef4444', label: 'Cancelled' };
      default: return { icon: 'hourglass', color: '#f59e0b', label: 'Pending' };
    }
  };
  const statusStyle = getStatusStyle();

  return (
    <Animated.View style={styles.card} entering={FadeInUp.delay(index * 100).duration(500)}>
      <View style={styles.cardHeader}>
        <View style={styles.productInfoContainer}>
          <Text style={styles.productName}>{order.productName}</Text>
          <Text style={styles.orderId}>ID: {order.id}</Text>
        </View>
        <Text style={styles.price}>₹{order.totalPrice.toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailItem}>
          <Ionicons name="cube-outline" size={16} color="#8b949e" />
          <Text style={styles.detailText}>Quantity: {order.quantity} {order.unit}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="rocket-outline" size={16} color="#8b949e" />
          <Text style={styles.detailText}>Delivery: {format(order.deliveryDate, "dd MMM, yyyy")}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: `${statusStyle.color}20`, borderColor: statusStyle.color }]}>
          <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// --- MAIN SCREEN ---
export default function CustomerOrdersScreen() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [userName, setUserName] = useState("Customer");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const userId = auth.currentUser?.uid;

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!userId) return setLoading(false);
        setLoading(true);
        try {
          // Get user name
          const userDoc = await db.collection("users").doc(userId).get();
          setUserName(userDoc.exists ? userDoc.data()?.name : auth.currentUser?.displayName || "Customer");

          // Fetch orders
          const snap = await db.collection("orders").where("userId", "==", userId).get();
          const fetchedOrders: Order[] = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              productName: data.productName,
              quantity: data.quantity,
              unit: data.unit,
              price: data.price,
              totalPrice: data.totalPrice,
              deliveryDate: data.deliveryDate?.toDate?.() || new Date(),
              orderedAt: data.orderedAt?.toDate?.() || new Date(),
              status: data.status || 'Pending',
            };
          }).sort((a, b) => b.orderedAt.getTime() - a.orderedAt.getTime());

          setAllOrders(fetchedOrders);
          if (fetchedOrders.length > 0) {
            setSelectedDate(format(fetchedOrders[0].orderedAt, "MMMM dd, yyyy"));
          }
        } catch (err) {
          console.error("Error fetching orders:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [userId])
  );

  const { dateOptions, ordersForSelectedDate } = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    allOrders.forEach(order => {
      const key = format(order.orderedAt, "MMMM dd, yyyy");
      if (!groups[key]) groups[key] = [];
      groups[key].push(order);
    });
    const uniqueDates = Object.keys(groups);
    const orders = selectedDate ? groups[selectedDate] || [] : [];
    return { dateOptions: uniqueDates, ordersForSelectedDate: orders };
  }, [allOrders, selectedDate]);

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDropdownOpen(!isDropdownOpen);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    toggleDropdown();
  };

  const downloadInvoicesForSelectedDate = async () => {
    if (!ordersForSelectedDate.length) {
      Alert.alert("No Orders", "There are no orders for this date.");
      return;
    }
    try {
      const htmlItems = ordersForSelectedDate.map(order => `
        <div class="invoice-item">
          <h3>${order.productName}</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Quantity:</strong> ${order.quantity} ${order.unit}</p>
          <p><strong>Total:</strong> ₹${order.totalPrice.toLocaleString('en-IN')}</p>
        </div>
      `).join('');

      const html = `<!DOCTYPE html><html><head><style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0d1117; color: #fff; padding: 20px; }
        .container { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 30px; max-width: 800px; margin: auto; }
        .header, .footer { text-align: center; margin-bottom: 20px; }
        .header h1 { color: #58a6ff; }
        .invoice-item { margin-top: 20px; padding: 15px; background: #0d1117; border: 1px solid #30363d; border-radius: 8px; }
        h3 { margin: 0 0 10px; color: #58a6ff; }
        p { margin: 4px 0; color: #c9d1d9; }
      </style></head><body>
        <div class="container">
          <div class="header"><h1>Invoices</h1><h2>${selectedDate}</h2></div>
          ${htmlItems}
          <div class="footer">Thank you, ${userName}!</div>
        </div>
      </body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { dialogTitle: `Invoices for ${selectedDate}` });
    } catch (error) {
      Alert.alert("Error", "Failed to generate invoice PDF.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Orders</Text>
        {selectedDate && !loading && (
          <TouchableOpacity onPress={downloadInvoicesForSelectedDate} style={styles.downloadButton}>
            <Ionicons name="download-outline" size={22} color="#58a6ff" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#58a6ff" style={{ flex: 1 }} />
      ) : dateOptions.length > 0 ? (
        <>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity onPress={toggleDropdown} style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>{selectedDate || 'Select a Date'}</Text>
              <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={24} color="#58a6ff" />
            </TouchableOpacity>
            {isDropdownOpen && (
              <Animated.View style={styles.dropdownList} entering={FadeInUp}>
                <FlatList
                  data={dateOptions}
                  keyExtractor={item => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleSelectDate(item)} style={styles.dropdownItem}>
                      <Text style={[styles.dropdownItemText, selectedDate === item && styles.dropdownItemSelectedText]}>{item}</Text>
                      {selectedDate === item && <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />}
                    </TouchableOpacity>
                  )}
                />
              </Animated.View>
            )}
          </View>
          <FlatList
            data={ordersForSelectedDate}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }}
            renderItem={({ item, index }) => <OrderCard order={item} index={index} />}
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="file-tray-stacked-outline" size={80} color="#30363d" />
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptySubtitle}>Your purchases will appear here.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}


// --- STYLESHEET ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#010409",
  },
  headerContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#30363d'
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f0f6fc",
  },
  downloadButton: {
    padding: 10,
  },
  dropdownContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    zIndex: 10,
  },
  dropdownHeader: {
    backgroundColor: '#161b22',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownHeaderText: {
    color: '#58a6ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdownList: {
    backgroundColor: '#161b22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363d',
    marginTop: 8,
    maxHeight: 240,
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    color: '#c9d1d9',
    fontSize: 16,
  },
  dropdownItemSelectedText: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: "#161b22",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#30363d',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productInfoContainer: {
    flex: 1, // This is crucial for preventing overflow
    marginRight: 10, // Space between text and price
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f0f6fc',
    flexShrink: 1, // Allows text to wrap if needed
  },
  orderId: {
    fontSize: 12,
    color: '#8b949e',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  price: {
    fontSize: 18,
    color: '#f0f6fc',
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1, // Allows detail items to share space
  },
  detailText: {
    color: '#8b949e',
    fontSize: 14,
    marginLeft: 8,
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#30363d',
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8b949e',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8b949e',
    marginTop: 8,
  }
});