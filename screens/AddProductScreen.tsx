import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { collection, addDoc, Timestamp, setDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { DashboardStackParamList } from "../types/navigation";
import * as ImagePicker from "expo-image-picker";
import { uploadToCloudinary } from "../services/cloudinary";
import Toast from "react-native-toast-message";

type AddProductRouteProp = RouteProp<DashboardStackParamList, "AddProduct">;

export default function AddProductScreen() {
  const navigation = useNavigation();
  const route = useRoute<AddProductRouteProp>();
  const existingProduct = route?.params?.product;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"kg" | "pcs">("pcs");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name || "");
      setPrice(existingProduct.price?.toString() || "");
      setDesc(existingProduct.description || "");
      setQuantity(existingProduct.quantity?.toString() || "");
      setUnit(existingProduct.unit || "pcs");
      setImageUrl(existingProduct.imageUrl || null);
      setPublicId(existingProduct.publicId || null);
    }
  }, [existingProduct]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        setUploading(true);
        const { secureUrl, publicId } = await uploadToCloudinary(
          result.assets[0].uri
        );
        setImageUrl(secureUrl);
        setPublicId(publicId);
      } catch (err) {
        console.error("Image upload failed:", err);
        Alert.alert("Upload Error", "Failed to upload image.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || isNaN(Number(price))) {
      Alert.alert("Validation Error", "Please enter valid name and price");
      return;
    }

    setLoading(true);

    const productData = {
      name,
      price: Number(price),
      description: desc,
      quantity: Number(quantity),
      unit,
      imageUrl,
      publicId,
      updatedAt: Timestamp.now(),
    };

    try {
      if (existingProduct?.id) {
        await setDoc(doc(db, "products", existingProduct.id), productData, {
          merge: true,
        });
        Toast.show({
          type: "success",
          text1: "Product updated successfully",
        });

        
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: Timestamp.now(),
        });
        Toast.show({
          type: "success",
          text1: "Product updated successfully",
        });
        // Alert.alert("Success", "Product added successfully!");
      }

      setName("");
      setPrice("");
      setDesc("");
      setQuantity("");
      setUnit("pcs");
      setImageUrl(null);
      setPublicId(null);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView className="px-6 py-8">
        <Text className="text-2xl font-bold text-blue-700 text-center mb-6">
          {existingProduct ? "Edit Product" : "Add New Product"}
        </Text>

        {/* Upload Image */}
        <TouchableOpacity
          className="bg-gray-200 rounded-xl mb-4 p-4 items-center justify-center"
          onPress={pickImage}
          disabled={uploading}
        >
          <Text className="text-blue-700 font-medium">
            {uploading ? "Uploading..." : "Pick Product Image"}
          </Text>
        </TouchableOpacity>

        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: "100%", height: 200, borderRadius: 12 }}
            className="mb-4"
          />
        )}

        {/* Inputs... */}
        {/* Product Name */}
        <TextInput
          placeholder="Product Name"
          value={name}
          onChangeText={setName}
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3"
        />

        {/* Price */}
        <TextInput
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3"
        />

        {/* Description */}
        <TextInput
          placeholder="Description"
          value={desc}
          onChangeText={setDesc}
          multiline
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3"
        />

        {/* Quantity */}
        <TextInput
          placeholder="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3"
        />

        {/* Unit */}
        <View className="flex-row mb-6 gap-4">
          <TouchableOpacity
            onPress={() => setUnit("pcs")}
            className={`px-4 py-2 rounded-full border ${
              unit === "pcs" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-sm ${
                unit === "pcs" ? "text-white" : "text-gray-800"
              }`}
            >
              Pcs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setUnit("kg")}
            className={`px-4 py-2 rounded-full border ${
              unit === "kg" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-sm ${
                unit === "kg" ? "text-white" : "text-gray-800"
              }`}
            >
              Kg
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`bg-blue-600 p-4 rounded-xl ${loading ? "opacity-50" : ""}`}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white text-center text-lg font-semibold">
            {loading
              ? "Saving..."
              : existingProduct
                ? "Update Product"
                : "Add Product"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}