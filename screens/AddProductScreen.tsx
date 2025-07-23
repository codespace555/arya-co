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
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { collection, addDoc, Timestamp, setDoc, doc } from "@react-native-firebase/firestore";
import { db } from "../services/firebase";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { DashboardStackParamList } from "../types/navigation";
import * as ImagePicker from "expo-image-picker";
import { uploadToCloudinary } from "../services/cloudinary";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/Ionicons";

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
          text1: "Product added successfully",
        });
      }
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
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.header}>
          {existingProduct?.id ? "Edit Product" : "Add New Product"}
        </Text>

        {/* Image Picker */}
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#A5B4FC" />
          ) : (
            <>
              <Icon name="cloud-upload-outline" size={24} color="#A5B4FC" />
              <Text style={styles.imagePickerText}>Upload Product Image</Text>
            </>
          )}
        </TouchableOpacity>

        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
        )}

        {/* Form Inputs */}
        <Text style={styles.label}>Product Name</Text>
        <TextInput
          placeholder="e.g., Fresh Apples"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#8b949e"
        />

        <Text style={styles.label}>Price</Text>
        <TextInput
          placeholder="e.g., 100"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#8b949e"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          placeholder="e.g., Sweet and juicy apples from the Himalayas"
          value={desc}
          onChangeText={setDesc}
          multiline
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholderTextColor="#8b949e"
        />

        <Text style={styles.label}>Quantity</Text>
        <TextInput
          placeholder="e.g., 50"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#8b949e"
        />

        <Text style={styles.label}>Unit</Text>
        <View style={styles.unitContainer}>
          <TouchableOpacity
            onPress={() => setUnit("pcs")}
            style={[styles.unitButton, unit === "pcs" && styles.unitButtonSelected]}
          >
            <Text style={[styles.unitButtonText, unit === "pcs" && styles.unitButtonTextSelected]}>
              Pieces (pcs)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setUnit("kg")}
            style={[styles.unitButton, unit === "kg" && styles.unitButtonSelected]}
          >
            <Text style={[styles.unitButtonText, unit === "kg" && styles.unitButtonTextSelected]}>
              Kilograms (kg)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (loading || uploading) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading || uploading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingProduct?.id ? "Update Product" : "Save Product"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D1117', // Black background
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
    imagePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1C2128',
        borderWidth: 1,
        borderColor: '#30363D',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
    },
    imagePickerText: {
        color: '#A5B4FC',
        marginLeft: 10,
        fontWeight: '600',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#30363D',
    },
    unitContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    unitButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#1C2128',
        borderWidth: 1,
        borderColor: '#30363D',
    },
    unitButtonSelected: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    unitButtonText: {
        color: '#c9d1d9',
        fontWeight: '600',
    },
    unitButtonTextSelected: {
        color: '#FFFFFF',
    },
    submitButton: {
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.6,
    },
});
