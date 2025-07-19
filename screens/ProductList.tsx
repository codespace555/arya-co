import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import {
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DrawerParamList, DashboardStackParamList } from "../types/navigation";
import Toast from "react-native-toast-message";

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  quantity?: number;
  unit?: "kg" | "pcs";
  createdAt?: Date;
  updatedAt?: Date;
  imageUrl?: string | null;
  publicId: string | null;
}

type NavProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, "Dashboard">,
  NativeStackNavigationProp<DashboardStackParamList>
>;

export default function ProductList() {
  const navigation = useNavigation<NavProp>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "products", id));
              setProducts((prev) =>
                prev.filter((product) => product.id !== id)
              );
              Toast.show({
                type: "success",
                text1: "Product deleted successfully",
              });
            } catch (error) {
              console.error("Delete failed:", error);
              Toast.show({
                type: "error",
                text1: "Failed to delete product",
                text2: error instanceof Error ? error.message : "Unknown error",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View className="flex-row bg-white border border-gray-200 rounded-xl  shadow-md overflow-hidden">
      <View>
        {/* Image Section */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="w-36 h-36"
            resizeMode="cover"
          />
        ) : (
          <View className="w-32 h-32 bg-gray-100 justify-center items-center">
            <Text className="text-xs text-gray-400">No Image</Text>
          </View>
        )}
      </View>
      {/* Content Section */}
      <View className="flex-1 p-4 justify-between">
        <View>
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            {item.name}
          </Text>
          <Text className="text-sm text-gray-600 mb-1">
            ₹ {item.price} • {item.quantity} {item.unit}
          </Text>
          {item.description ? (
            <Text className="text-sm text-gray-500 mb-2" numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View className="flex-row mt-2">
          <TouchableOpacity
            className="bg-blue-600 px-3 py-1 rounded-md mr-2"
            onPress={() =>
              navigation.navigate("Dashboard", {
                screen: "AddProduct",
                params: { product: item },
              } as never)
            }
          >
            <Text className="text-white text-sm font-medium">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-red-600 px-3 py-1 rounded-md"
            onPress={() => handleDelete(item.id)}
          >
            <Text className="text-white text-sm font-medium">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1  px-4 py-12">
      {loading ? (
        <ActivityIndicator size="large" color="#1e40af" />
      ) : products.length === 0 ? (
        <Text className="text-center text-gray-500 mt-4">
          No products found.
        </Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        className="bg-blue-600 p-4 rounded-2xl mt-6 shadow-md"
        onPress={() =>
          navigation.navigate("Dashboard", {
            screen: "AddProduct",
            params: { product: {} },
          } as never)
        }
      >
        <Text className="text-white text-lg font-semibold text-center">
          Add Product
        </Text>
      </TouchableOpacity>
    </View>
  );
}
