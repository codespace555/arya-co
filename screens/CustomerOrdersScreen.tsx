import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { format } from "date-fns";
import { useFocusEffect } from "@react-navigation/native";

interface Order {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
  deliveryDate: Date;
  orderedAt: Date;
  status: string;
}

export default function CustomerOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [userName, setUserName] = useState<string>("Customer");
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchUserName = async () => {
      if (!userId) return;
      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.name || "Customer");
        } else {
          setUserName(auth.currentUser?.displayName || "Customer");
        }
      } catch (error) {
        console.error("Failed to fetch user name:", error);
        setUserName(auth.currentUser?.displayName || "Customer");
      }
    };

    fetchUserName();
  }, [userId]);
useFocusEffect(
  useCallback(() => {
    const fetchOrders = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const q = query(collection(db, "orders"), where("userId", "==", userId));
        const snap = await getDocs(q);

        const fetchedOrders: Order[] = snap.docs.map((doc) => {
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
            status: data.status,
          };
        });

        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId])
);


  const generateInvoice = async (order: Order) => {
    try {
      const deliveryDate = format(order.deliveryDate, "dd MMM yyyy");
      const orderedAt = format(order.orderedAt, "dd MMM yyyy hh:mm a");

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Order Invoice</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 40px;
                background-color: #f9fafb;
                color: #333;
              }
              .invoice-container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                max-width: 600px;
                margin: auto;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              h1 {
                text-align: center;
                color: #1d4ed8;
                margin-bottom: 10px;
              }
              .company {
                text-align: center;
                font-size: 18px;
                margin-bottom: 30px;
                color: #111827;
                font-weight: 600;
              }
              hr {
                border: none;
                height: 1px;
                background-color: #e5e7eb;
                margin: 20px 0;
              }
              p {
                font-size: 16px;
                margin: 8px 0;
              }
              strong {
                color: #111827;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 14px;
                color: #6b7280;
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <h1>Order Invoice</h1>
              <div class="company">Arya & Co.</div>
              <hr />
              <p><strong>Customer Name:</strong> ${userName}</p>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Product:</strong> ${order.productName}</p>
              <p><strong>Quantity:</strong> ${order.quantity} ${order.unit}</p>
              <p><strong>Price per unit:</strong> ₹${order.price}</p>
              <p><strong>Total:</strong> ₹${order.totalPrice}</p>
              <p><strong>Ordered At:</strong> ${orderedAt}</p>
              <p><strong>Delivery Date:</strong> ${deliveryDate}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <hr />
              <div class="footer">Thank you for your order, ${userName}!</div>
            </div>
          </body>
        </html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (uri) await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#2563EB", marginBottom: 16 }}>
        My Orders
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text>No orders yet.</Text>}
          renderItem={({ item }) => (
            <View
              style={{
                marginBottom: 16,
                padding: 16,
                borderRadius: 8,
                backgroundColor: "#F9FAFB",
                borderColor: "#E5E7EB",
                borderWidth: 1,
              }}
            >
              <Text style={{ fontWeight: "600", fontSize: 18, marginBottom: 8 }}>
                {item.productName}
              </Text>
              <Text>Quantity: {item.quantity} {item.unit}</Text>
              <Text>Price: ₹{item.price} x {item.quantity}</Text>
              <Text style={{ fontWeight: "700", color: "black" }}>Total: ₹{item.totalPrice}</Text>
              <Text>Status: {item.status}</Text>
              <Text>Ordered On: {format(item.orderedAt, "dd MMM yyyy hh:mm a")}</Text>
              <Text>Delivery Date: {format(item.deliveryDate, "dd MMM yyyy")}</Text>

              <TouchableOpacity
                onPress={() => generateInvoice(item)}
                style={{
                  marginTop: 12,
                  backgroundColor: "#2563EB",
                  paddingVertical: 10,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
                  Download Invoice
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
