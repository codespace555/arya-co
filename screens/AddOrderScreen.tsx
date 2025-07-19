import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";

export default function AddOrderScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(() => getTomorrow());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const ps = await getDocs(collection(db, "products"));
        const us = await getDocs(collection(db, "users"));
        setProducts(ps.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setUsers(us.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch {
        Toast.show({ type: "error", text1: "Failed loading data" });
      }
    }
    fetchData();
  }, []);

  const handleOrder = async () => {
    if (!selectedProduct || !selectedUser || !quantity) {
      Toast.show({ type: "error", text1: "Select product, user & quantity" });
      return;
    }
    const qtyNum = parseInt(quantity);
    if (qtyNum <= 0) {
      Toast.show({ type: "error", text1: "Quantity must be > 0" });
      return;
    }
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
        deliveryDate: Timestamp.fromDate(selectedDate),
        orderedAt: Timestamp.now(),
        status: "processing",
      });

      Toast.show({ type: "success", text1: "Order placed" });
      // reset
      setSelectedProduct(null);
      setSelectedUser(null);
      setQuantity("");
      setSelectedDate(getTomorrow());
    } catch {
      Toast.show({ type: "error", text1: "Failed placing order" });
    }
  };

  const orderTotal = selectedProduct
    ? parseInt(quantity || "0") * selectedProduct.price
    : 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white p-4"
    >
      <Text className="text-2xl font-bold text-blue-600 mb-6">
        Place a New Order
      </Text>

      <View className="space-y-4">

        {/* User Selection */}
        <View>
          <Pressable onPress={() => setUserModalVisible(true)}>
            <Text className="text-blue-600 underline text-base">Select User</Text>
          </Pressable>
          <Text className="mt-1 text-base text-gray-700 font-semibold">
            {selectedUser
              ? users.find((u) => u.id === selectedUser)?.name || "User"
              : "No user selected"}
          </Text>
        </View>

        {/* Product Selection */}
        <View>
          <Pressable onPress={() => setProductModalVisible(true)}>
            <Text className="text-blue-600 underline text-base">Select Product</Text>
          </Pressable>
          <Text className="mt-1 text-base text-gray-700 font-semibold">
            {selectedProduct?.name || "No product selected"}
          </Text>
        </View>

        {/* Quantity + Total */}
        {selectedProduct && (
          <View>
            <Text className="text-gray-700 mb-1">
              Price : ₹{selectedProduct.price} / {selectedProduct.unit}
            </Text>
            <View className="flex-row items-center border rounded mb-2">
              <TextInput
                className="flex-1 p-2 text-base"
                keyboardType="numeric"
                placeholder="Enter quantity"
                value={quantity}
                onChangeText={setQuantity}
              />
              <Text className="bg-blue-500 text-white px-3 py-2">
                {selectedProduct.unit}
              </Text>
            </View>
            <Text className="text-green-700 font-medium">
              Total Price: ₹{orderTotal.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Delivery Date */}
        <TouchableOpacity
          className="p-3 border rounded bg-blue-100"
          onPress={() => setShowDatePicker(true)}
        >
          <Text className="text-blue-800 font-medium">
            Delivery Date: {format(selectedDate, "dd MMM yyyy")}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={getTomorrow()}
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) setSelectedDate(d);
            }}
          />
        )}

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-blue-600 p-4 rounded mt-4"
          onPress={handleOrder}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Place Order
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={userModalVisible}
        onRequestClose={() => setUserModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setUserModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-black/50">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="w-11/12 bg-white rounded-2xl p-4 shadow-lg">
                <Picker
                  selectedValue={selectedUser}
                  onValueChange={setSelectedUser}
                  mode="dropdown"
                >
                  <Picker.Item color="black" label="— Select User —" value={null} />
                  {users.map((u) => (
                    <Picker.Item
                    color="black"
                      key={u.id}
                      label={u.name || u.phone}
                      value={u.id}
                    />
                  ))}
                </Picker>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Product Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={productModalVisible}
        onRequestClose={() => setProductModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setProductModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-black/50">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="w-11/12 bg-slate-200 text-black rounded-2xl p-4 shadow-lg">
                <Picker
                  selectedValue={selectedProduct?.id}
                  onValueChange={(pid) =>
                    setSelectedProduct(
                      products.find((p) => p.id === pid) || null
                    )
                  }
                  mode="dropdown"
                >
                  <Picker.Item color="black" label="— Select Product —" value={null} />
                  {products.map((p) => (
                    <Picker.Item color="black" key={p.id} label={p.name} value={p.id} />
                  ))}
                </Picker>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Toast />
    </KeyboardAvoidingView>
  );
}

// Utility
function getTomorrow(): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() + 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
