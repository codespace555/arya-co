import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { collection, addDoc, Timestamp, getDocs } from "@react-native-firebase/firestore";
import { db } from "../services/firebase";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Ionicons";
import { Product, User } from "../types/interfaces"; // Assuming types are in interfaces

// Utility to get tomorrow's date
function getTomorrow(): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() + 1);
  return dt;
}

export default function AddOrderScreen() {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<Date>(getTomorrow());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const productsSnapshot = await getDocs(collection(db, "products"));
        const usersSnapshot = await getDocs(collection(db, "users"));
        setProducts(productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[]);
        setUsers(usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[]);
      } catch (error) {
        Toast.show({ type: "error", text1: "Failed to load initial data" });
        console.error("Data fetch error: ", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleOrder = async () => {
    if (!selectedProduct || !selectedUser || !quantity) {
      Toast.show({ type: "error", text1: "Please fill all fields" });
      return;
    }
    const qtyNum = parseInt(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Toast.show({ type: "error", text1: "Quantity must be a number greater than 0" });
      return;
    }

    setSaving(true);
    try {
      const total = qtyNum * selectedProduct.price;
      await addDoc(collection(db, "orders"), {
        userId: selectedUser,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        price: selectedProduct.price,
        unit: selectedProduct.unit,
        quantity: qtyNum,
        totalPrice: total,
        deliveryDate: Timestamp.fromDate(deliveryDate),
        orderedAt: Timestamp.now(),
        status: "pending",
      });

      Toast.show({ type: "success", text1: "Order placed successfully!" });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to place order" });
      console.error("Order submission error: ", error);
    } finally {
      setSaving(false);
    }
  };

  const orderTotal = selectedProduct ? (parseInt(quantity) || 0) * selectedProduct.price : 0;
  const selectedUserName = users.find(u => u.id === selectedUser)?.name || "Select a user";
  const selectedProductName = selectedProduct?.name || "Select a product";

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.header}>Create New Order</Text>

        {/* User Selection */}
        <Text style={styles.label}>Customer</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setUserModalVisible(true)}>
          <Text style={styles.pickerButtonText}>{selectedUserName}</Text>
          <Icon name="chevron-down-outline" size={20} color="#8b949e" />
        </TouchableOpacity>

        {/* Product Selection */}
        <Text style={styles.label}>Product</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setProductModalVisible(true)}>
          <Text style={styles.pickerButtonText}>{selectedProductName}</Text>
          <Icon name="chevron-down-outline" size={20} color="#8b949e" />
        </TouchableOpacity>

        {/* Quantity and Price */}
        {selectedProduct && (
          <>
            <Text style={styles.label}>Quantity ({selectedProduct.unit})</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder={`e.g., 10`}
              placeholderTextColor="#8b949e"
              value={quantity}
              onChangeText={setQuantity}
            />
            <Text style={styles.totalText}>Order Total: ₹{orderTotal.toFixed(2)}</Text>
          </>
        )}

        {/* Delivery Date */}
        <Text style={styles.label}>Delivery Date</Text>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.pickerButtonText}>{format(deliveryDate, "EEEE, dd MMMM yyyy")}</Text>
          <Icon name="calendar-outline" size={20} color="#8b949e" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={deliveryDate}
            mode="date"
            display="default"
            minimumDate={getTomorrow()}
            onChange={(_, d) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (d) setDeliveryDate(d);
            }}
          />
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.disabledButton]}
          onPress={handleOrder}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* User Modal */}
      <Modal transparent visible={userModalVisible} animationType="fade" onRequestClose={() => setUserModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setUserModalVisible(false)}>
          <View style={styles.modalContent}>
            <Picker
              selectedValue={selectedUser}
              onValueChange={(itemValue) => {
                setSelectedUser(itemValue);
                setUserModalVisible(false);
              }}
              itemStyle={{ color: '#c9d1d9' }}
            >
              <Picker.Item label="— Select a Customer —" value={null} />
              {users.map((u) => <Picker.Item key={u.id} label={u.name || u.phone} value={u.id} />)}
            </Picker>
          </View>
        </Pressable>
      </Modal>

      {/* Product Modal */}
      <Modal transparent visible={productModalVisible} animationType="fade" onRequestClose={() => setProductModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setProductModalVisible(false)}>
          <View style={styles.modalContent}>
            <Picker
              selectedValue={selectedProduct?.id}
              onValueChange={(itemValue) => {
                setSelectedProduct(products.find(p => p.id === itemValue) || null);
                setProductModalVisible(false);
              }}
              itemStyle={{ color: '#c9d1d9' }}
            >
              <Picker.Item label="— Select a Product —" value={null} />
              {products.map((p) => <Picker.Item key={p.id} label={`${p.name} (₹${p.price}/${p.unit})`} value={p.id} />)}
            </Picker>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D1117',
    },
    scrollViewContent: {
        padding: 20,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#c9d1d9',
        textAlign: 'center',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8b949e',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1C2128',
        borderWidth: 1,
        borderColor: '#30363D',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#c9d1d9',
        marginBottom: 16,
    },
    pickerButton: {
        backgroundColor: '#1C2128',
        borderWidth: 1,
        borderColor: '#30363D',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#c9d1d9',
    },
    totalText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4F46E5',
        textAlign: 'right',
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.6,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        backgroundColor: '#1C2128',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
    },
});
