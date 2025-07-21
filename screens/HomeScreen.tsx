import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  StyleSheet,
  SafeAreaView,
  Animated,
} from "react-native";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import Toast from "react-native-toast-message";

// --- TYPE DEFINITIONS ---
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  imageUrl?: string;
}

interface OrderData {
  quantity?: string;
  date?: Date;
}

interface CardHandlers {
  handleQuantityChange: (id: string, quantity: string) => void;
  updateQuantity: (id: string, amount: number) => void;
  openDateModal: (product: Product) => void;
  handleOrder: (product: Product) => Promise<void>;
  openDescriptionModal: (product: Product) => void;
}

interface ProductCardProps {
  item: Product;
  orderData: OrderData;
  handlers: CardHandlers;
}


// -- Animated Product Card Component --
const ProductCard = ({ item, orderData, handlers }: ProductCardProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const { handleQuantityChange, updateQuantity, openDateModal, handleOrder, openDescriptionModal } = handlers;

  const quantityStr = orderData.quantity || "";
  const quantityNum = parseInt(quantityStr || "0", 10);
  const total = quantityNum * item.price;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const selectedDate = orderData.date || tomorrow;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.card}>
        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} style={styles.productImage} />
          <View style={styles.textContainer}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>₹{item.price} / {item.unit}</Text>
            <TouchableOpacity onPress={() => openDescriptionModal(item)}>
              <Text style={styles.detailsButton}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.quantityWrapper}>
            <Text style={styles.controlLabel}>Quantity</Text>
            <View style={styles.quantityInputContainer}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={[styles.quantityButton, styles.decreaseButton]}>
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                keyboardType="numeric" style={styles.quantityInput} value={quantityStr}
                onChangeText={(text) => handleQuantityChange(item.id, text)}
                placeholder="0" placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={[styles.quantityButton, styles.increaseButton]}>
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.dateWrapper}>
            <Text style={styles.controlLabel}>Delivery Date</Text>
            <TouchableOpacity onPress={() => openDateModal(item)} style={styles.datePickerButton}>
              <Text style={styles.datePickerText}>{format(selectedDate, "dd MMM yyyy")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {quantityNum > 0 && <Text style={styles.totalText}>Order Total: ₹{total.toFixed(2)}</Text>}

        {/* Place Order Button */}
        <TouchableOpacity
          style={[styles.orderButton, quantityNum > 0 ? styles.orderButtonActive : styles.orderButtonDisabled]}
          onPress={() => handleOrder(item)} disabled={!quantityNum || quantityNum <= 0}
        >
          <Text style={styles.orderButtonText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};


// -- Main HomeScreen Component --
export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<{ [key: string]: OrderData }>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for Description Modal
  const [isDescModalVisible, setIsDescModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // State for Date Picker Modal
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [editingDateForProduct, setEditingDateForProduct] = useState<Product | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const userId = auth.currentUser?.uid;

  useEffect(() => { /* ... fetchProducts logic is unchanged ... */
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Product, "id">)}));
        setProducts(data);
      } catch (err) { Toast.show({ type: "error", text1: "Failed to load products" }); }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => { /* ... filtering logic is unchanged ... */
    if (!searchQuery) return products;
    return products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const handleQuantityChange = (id: string, quantity: string) => {
    if (quantity === "" || /^[0-9]+$/.test(quantity)) {
      setOrders((prev) => ({ ...prev, [id]: { ...prev[id], quantity } }));
    }
  };

  const updateQuantity = (id: string, amount: number) => {
    const currentQuantity = parseInt(orders[id]?.quantity || "0", 10);
    const newQuantity = Math.max(0, currentQuantity + amount);
    handleQuantityChange(id, newQuantity.toString());
  };
  
  const openDateModal = (product: Product) => {
    setEditingDateForProduct(product);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const currentDate = orders[product.id]?.date || tomorrow;
    setTempDate(currentDate);
    setIsDateModalVisible(true);
  };
  
  const confirmDateSelection = () => {
    if (editingDateForProduct) {
      setOrders(prev => ({
        ...prev,
        [editingDateForProduct.id]: { ...prev[editingDateForProduct.id], date: tempDate }
      }));
    }
    setIsDateModalVisible(false);
    setEditingDateForProduct(null);
  };

  const handleOrder = async (product: Product) => { /* ... handleOrder logic is unchanged ... */
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { quantity, date } = orders[product.id] || {};
    if (!userId) { Toast.show({ type: "error", text1: "Login required" }); return; }
    if (!quantity || parseInt(quantity, 10) <= 0) { Toast.show({ type: "error", text1: "Please enter a valid quantity" }); return; }
    try {
      await addDoc(collection(db, "orders"), {
        userId, productId: product.id, productName: product.name, price: product.price, unit: product.unit,
        quantity: parseInt(quantity, 10), deliveryDate: Timestamp.fromDate(date || tomorrow), orderedAt: Timestamp.now(),
        status: "processing", totalPrice: parseInt(quantity, 10) * product.price,
      });
      Toast.show({ type: "success", text1: "Order placed successfully!" });
      setOrders((prev) => ({ ...prev, [product.id]: {} }));
    } catch (err) { Toast.show({ type: "error", text1: "Failed to place order" }); }
  };

  const openDescriptionModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDescModalVisible(true);
  };
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Order From Factory</Text>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search for mithayi..." placeholderTextColor="#7a89a0" value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              orderData={orders[item.id] || {}}
              handlers={{ handleQuantityChange, updateQuantity, openDateModal, handleOrder, openDescriptionModal }}
            />
          )}
        />
        
        {/* Description Modal */}
        <Modal animationType="fade" transparent={true} visible={isDescModalVisible} onRequestClose={() => setIsDescModalVisible(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
                    <Text style={styles.modalDescription}>{selectedProduct?.description}</Text>
                    <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsDescModalVisible(false)}>
                        <Text style={styles.modalCloseButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* Date Picker Modal */}
        <Modal animationType="fade" transparent={true} visible={isDateModalVisible} onRequestClose={() => setIsDateModalVisible(false)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Delivery Date</Text>
                    <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="inline" // Shows the full calendar
                        minimumDate={tomorrow}
                        onChange={(event, date) => setTempDate(date || tempDate)}
                    />
                    <TouchableOpacity style={styles.confirmButton} onPress={confirmDateSelection}>
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050816' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', paddingVertical: 16 },
    searchContainer: { backgroundColor: '#1c2a41', flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, marginBottom: 16, paddingHorizontal: 16, },
    searchIcon: { fontSize: 20, marginRight: 12, color: '#94a3b8' },
    searchInput: { flex: 1, height: 50, color: '#fff', fontSize: 16 },
    card: { backgroundColor: '#10172a', borderRadius: 16, padding: 16, marginBottom: 16, borderColor: '#334155', borderWidth: 1, elevation: 8, },
    infoContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    productImage: { width: 90, height: 90, borderRadius: 12, marginRight: 16 },
    textContainer: { flex: 1 },
    productName: { fontSize: 20, fontWeight: 'bold', color: '#f0f4f8' },
    productPrice: { fontSize: 16, color: '#94a3b8', marginTop: 4 },
    detailsButton: { color: '#60a5fa', marginTop: 8, fontSize: 14, fontWeight: '600' },
    controlsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 16 },
    controlLabel: { color: '#cbd5e1', fontSize: 14, marginBottom: 8, fontWeight: '500' },
    quantityWrapper: { flex: 1 },
    dateWrapper: { flex: 1 },
    quantityInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a3b57', borderRadius: 12, height: 52, },
    quantityButton: { width: 50, height: '100%', alignItems: 'center', justifyContent: 'center', },
    decreaseButton: { backgroundColor: '#ef4444', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }, // RED
    increaseButton: { backgroundColor: '#22c55e', borderTopRightRadius: 12, borderBottomRightRadius: 12 }, // GREEN
    quantityButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    quantityInput: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' },
    datePickerButton: { backgroundColor: '#f97316', paddingVertical: 12, borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', }, // ORANGE
    datePickerText: { color: '#fff', fontWeight: 'bold' },
    totalText: { color: '#4ade80', fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 16 },
    orderButton: { paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
    orderButtonActive: { backgroundColor: '#3b82f6' }, // BLUE
    orderButtonDisabled: { backgroundColor: '#334155' },
    orderButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.8)' },
    modalContent: { backgroundColor: '#1e293b', borderRadius: 12, padding: 24, margin: 24, width: '90%', position: 'relative', borderColor: '#334155', borderWidth: 1, alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
    modalDescription: { fontSize: 16, color: '#cbd5e1', lineHeight: 24, textAlign: 'center' },
    modalCloseButton: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', },
    modalCloseButtonText: { color: '#fff', fontSize: 16 },
    confirmButton: { backgroundColor: '#22c55e', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, marginTop: 16, },
    confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});