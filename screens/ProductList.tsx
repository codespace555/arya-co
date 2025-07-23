import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TextInput,
  Animated,
} from "react-native";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
   FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { db } from "../services/firebase";
import { useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DrawerParamList, DashboardStackParamList } from "../types/navigation";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Ionicons";

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

// --- Animated Product Card Component ---
const ProductCard = ({ item, index, onEdit, onDelete }: { item: Product, index: number, onEdit: () => void, onDelete: () => void }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay: index * 100, // Stagger animation
            useNativeDriver: true,
        }).start();
    }, [fadeAnim, index]);

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.productCard}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Icon name="image-outline" size={40} color="#4b5563" />
                    </View>
                )}
                <View style={styles.productDetails}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>₹{item.price} <Text style={styles.productUnit}>/ {item.unit}</Text></Text>
                    <Text style={styles.productQuantity}>Stock: {item.quantity || 0}</Text>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={onEdit}>
                            <Icon name="pencil-outline" size={16} color="#fff" />
                            <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
                            <Icon name="trash-outline" size={16} color="#fff" />
                            <Text style={styles.actionButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};


export default function ProductList() {
  const navigation = useNavigation<NavProp>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot:  FirebaseFirestoreTypes.QuerySnapshot< FirebaseFirestoreTypes.DocumentData>) => {
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

  const filteredProducts = useMemo(() => {
    if (!searchQuery) {
        return products;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return products.filter(product => product.name.toLowerCase().includes(lowercasedQuery));
  }, [products, searchQuery]);

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
              Toast.show({
                type: "success",
                text1: "Product deleted successfully",
              });
            } catch (error) {
              console.error("Delete failed:", error);
              Toast.show({
                type: "error",
                text1: "Failed to delete product",
              });
            }
          },
        },
      ]
    );
  };

  const handleEdit = (product: Product) => {
    navigation.navigate("Dashboard", {
        screen: "AddProduct",
        params: { product },
    } as never);
  };

  const handleAddNew = () => {
    navigation.navigate("Dashboard", {
        screen: "AddProduct",
    } as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#8b949e" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#8b949e"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ flex: 1 }}/>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ProductCard 
                item={item} 
                index={index} 
                onEdit={() => handleEdit(item)} 
                onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found.</Text>
            </View>
          }
        />
      )}

      {/* Add Product FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddNew}>
        <Icon name="add-outline" size={30} color="#fff" />
      </TouchableOpacity>
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
        backgroundColor: '#1C2128',
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
        color: '#c9d1d9',
        fontSize: 16,
    },
    productCard: {
        backgroundColor: '#1C2128',
        borderRadius: 12,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#30363D',
    },
    productImage: {
        width: 120,
        height: '100%',
    },
    imagePlaceholder: {
        width: 120,
        height: '100%',
        backgroundColor: '#30363D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productDetails: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#c9d1d9',
    },
    productPrice: {
        fontSize: 16,
        color: '#4F46E5', // Blue accent for price
        fontWeight: '600',
        marginTop: 4,
    },
    productUnit: {
        fontSize: 14,
        color: '#8b949e',
        fontWeight: 'normal',
    },
    productQuantity: {
        fontSize: 14,
        color: '#8b949e',
        marginTop: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 6,
    },
    editButton: {
        backgroundColor: '#4F46E5', // Blue
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: '#D92626', // Red
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4F46E5', // Blue
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#4F46E5',
        shadowRadius: 8,
        shadowOpacity: 0.4,
        shadowOffset: { height: 4, width: 0 },
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
