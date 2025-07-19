import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import Toast from "react-native-toast-message";

export default function HomeScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<{ [key: string]: any }>({});
  const [showDatePicker, setShowDatePicker] = useState<{ [key: string]: boolean }>({});

  const userId = auth.currentUser ?.uid ;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(data);
      } catch (err) {
        Toast.show({ type: "error", text1: "Failed to load products" });
      }
    };

    fetchProducts();
  }, []);

  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  const handleQuantityChange = (id: string, quantity: string) => {
    setOrders((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        quantity,
      },
    }));
  };

  const handleDateChange = (id: string, event: any, selectedDate?: Date) => {
    setShowDatePicker((prev) => ({ ...prev, [id]: false }));
    if (selectedDate) {
      setOrders((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          date: selectedDate,
        },
      }));
    }
  };

  const handleOrder = async (product: any) => {
    const { quantity, date } = orders[product.id] || {};
    const deliveryDate = date || getTomorrow();

    if (!userId) {
      Toast.show({ type: "error", text1: "Login required to place orders" });
      return;
    }

    if (!quantity) {
      Toast.show({ type: "error", text1: "Please enter quantity" });
      return;
    }

    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      Toast.show({ type: "error", text1: "Quantity must be a positive number" });
      return;
    }

    try {
      await addDoc(collection(db, "orders"), {
        userId,
        productId: product.id,
        productName: product.name,
        price: product.price,
        unit: product.unit,
        quantity: numQuantity,
        deliveryDate: Timestamp.fromDate(deliveryDate),
        orderedAt: Timestamp.now(),
        status: "processing",
        totalPrice: numQuantity * product.price,
      });

      Toast.show({ type: "success", text1: "Order placed!" });
      setOrders((prev) => ({ ...prev, [product.id]: {} }));
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to place order" });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <View className="flex-1 p-4 bg-white">
        <Text className="text-2xl font-bold text-blue-600 mb-4">
          Available Products
        </Text>

        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const tomorrow = getTomorrow();
            const orderData = orders[item.id] || {};
            const quantity = parseInt(orderData.quantity || "0") || 0;
            const total = quantity * item.price;
            const selectedDate = orderData.date || tomorrow;

            return (
              <View className="mb-6 p-4 border rounded-md bg-gray-200 shadow-md">
                {/* Product Info */}
                <View className="flex flex-row justify-between mb-5">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold">{item.name}</Text>
                    <Text className="text-gray-600 mb-1">
                      {item.description}
                    </Text>
                    <Text className="text-gray-900 text-xl mb-1">
                      ₹{item.price} / {item.unit}
                    </Text>
                  </View>

                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      className="w-32 h-32 rounded-lg"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-32 h-32 bg-gray-100 justify-center items-center rounded-lg">
                      <Text className="text-xs text-gray-400">No Image</Text>
                    </View>
                  )}
                </View>

                {/* Quantity Input */}
                <View className="mb-2 flex-row items-center border rounded">
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Quantity"
                    className="p-2 flex-1"
                    value={orderData.quantity || ""}
                    onChangeText={(text) => handleQuantityChange(item.id, text)}
                  />
                  <Text className="text-white p-2 bg-blue-500">{item.unit}</Text>
                </View>

                {quantity > 0 && (
                  <Text className="text-green-700 font-medium mb-2">
                    Total: ₹{total.toFixed(2)}
                  </Text>
                )}

                {/* Date Picker */}
                <TouchableOpacity
                  onPress={() => {
                    setOrders((prev) => ({
                      ...prev,
                      [item.id]: {
                        ...prev[item.id],
                        date: selectedDate,
                      },
                    }));
                    setShowDatePicker((prev) => ({
                      ...prev,
                      [item.id]: true,
                    }));
                  }}
                  className="p-2 border rounded mb-2 bg-blue-100"
                >
                  <Text className="text-blue-800">
                    Delivery Date: {format(selectedDate, "dd MMM yyyy")}
                  </Text>
                </TouchableOpacity>

                {showDatePicker[item.id] && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    minimumDate={tomorrow}
                    onChange={(event, date) =>
                      handleDateChange(item.id, event, date)
                    }
                  />
                )}

                {/* Place Order Button */}
                <TouchableOpacity
                  className="bg-blue-600 p-3 rounded mt-2"
                  onPress={() => handleOrder(item)}
                >
                  <Text className="text-white text-center font-semibold">
                    Place Order
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
