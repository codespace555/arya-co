import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  ScrollView,
} from 'react-native';
import { doc, setDoc } from '@react-native-firebase/firestore';
// IMPORTANT: Ensure your firebase config file is correct and at this path.
import { authInstance as auth, db } from '../services/firebase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// IMPORTANT: Ensure your navigation types are correctly defined here.
import { RootStackParamList } from '../types/navigation';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
// NOTE: Ensure 'react-native-vector-icons' and its types ('@types/react-native-vector-icons') are installed.
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// IMPORTANT: Make sure you have the <Toast /> component in your main App.tsx file.
import Toast from 'react-native-toast-message';
import { CommonActions } from '@react-navigation/native';

// Define the screen's props using the navigation types.
type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

/**
 * RegisterScreen
 * A screen for new users to register by providing their name and address.
 * The phone number is pre-filled from the authentication step.
 */
export default function RegisterScreen({ route, navigation }: Props) {
  // Extract the user's unique ID from the navigation parameters.
  const { uid } = route.params;

  // State management for user inputs and loading indicators.
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  // useEffect hook to pre-fill the phone number when the component mounts.
  useEffect(() => {
    const userPhone = auth.currentUser?.phoneNumber;
    if (userPhone) {
      setPhone(userPhone);
    }
  }, []);

  /**
   * handleUseCurrentLocation
   * Asks for location permission and fetches the user's current address.
   */
  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      // Request permission to access the user's location.
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Please grant location permission in settings.',
        });
        setLoadingLocation(false);
        return;
      }

      // Get the current position and reverse-geocode it to an address.
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (place) {
        const formattedAddress = [
          place.name,
          place.street,
          place.city,
          place.region,
          place.postalCode,
        ]
          .filter(Boolean) // Remove any null/undefined parts
          .join(', ');
        setAddress(formattedAddress);
        Toast.show({
            type: 'success',
            text1: 'Location Found!',
            text2: 'Your address has been updated.'
        })
      } else {
        Toast.show({
          type: 'error',
          text1: 'Location Error',
          text2: 'Could not determine your address.',
        });
      }
    } catch (err) {
      console.error("Location fetching error:", err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred while fetching location.',
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  /**
   * handleRegister
   * Validates user input, saves the data to Firestore, and navigates to the main app.
   */
  const handleRegister = async () => {
    // Validate that the name field is not empty.
    if (!name.trim()) {
      return Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please enter your full name to continue.',
      });
    }

    try {
      // Create a new document in the 'users' collection with the user's data.
      await setDoc(doc(db, 'users', uid), {
        uid,
        name: name.trim(),
        phone,
        address: address.trim(),
        role: 'customer', // Default role for new sign-ups
        createdAt: new Date(),
      });

      // Show a success message.
      Toast.show({
        type: 'success',
        text1: 'Registration Successful!',
        text2: 'Welcome to Mithayi Sweets!',
      });
      
      // Navigate to the main customer-facing app ('Arya') and reset the navigation stack.
      // This prevents the user from going back to the registration screen.
     navigation.replace('Arya', { screen: 'Home' });

    } catch (err) {
      console.error('Error saving user data:', err);
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: 'There was an error saving your information.',
      });
    }
  };

  // Render the UI.
  return (
    <LinearGradient colors={['#1e3a8a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flexContainer}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.innerContainer}>
              {/* Header Section */}
              <Animatable.View animation="fadeInDown" duration={1000} style={styles.headerContainer}>
                <Icon name="muffin" size={50} color="#FBBF24" />
                <Text style={styles.headerText}>
                  Welcome to <Text style={styles.brandName}>Arya & co</Text>
                </Text>
                <Text style={styles.subHeaderText}>Let's get you set up</Text>
              </Animatable.View>

              {/* Form Section with Input Fields */}
              <Animatable.View animation="fadeInUp" duration={1000} delay={200}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Icon name="account-outline" size={24} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your full name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Icon name="phone-outline" size={24} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    value={phone}
                    editable={false}
                    style={[styles.input, styles.disabledInput]}
                  />
                </View>

                <Text style={styles.label}>Delivery Address</Text>
                <View style={styles.inputContainer}>
                  <Icon name="map-marker-outline" size={24} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter address or use current location"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.input}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </Animatable.View>

              {/* Buttons Section */}
              <Animatable.View animation="fadeInUp" duration={1000} delay={400}>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleUseCurrentLocation}
                  disabled={loadingLocation}>
                  <Icon name="crosshairs-gps" size={20} color="#FBBF24" />
                  <Text style={styles.locationButtonText}>
                    {loadingLocation ? 'Fetching Location...' : 'Use Current Location'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRegister} style={styles.registerButton}>
                  <LinearGradient
                    colors={['#FBBF24', '#D97706']}
                    style={styles.gradientButton}>
                    <Text style={styles.registerButtonText}>Complete Registration</Text>
                    <Icon name="arrow-right-circle-outline" size={22} color="#000" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}

// StyleSheet for all the component styles.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  innerContainer: {
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 15,
  },
  brandName: {
    fontWeight: 'bold',
    color: '#FBBF24',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledInput: {
    color: '#94a3b8',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FBBF24',
    paddingVertical: 12,
    borderRadius: 50,
    marginBottom: 20,
  },
  locationButtonText: {
    color: '#FBBF24',
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  registerButton: {
    borderRadius: 50,
    shadowColor: "#FBBF24",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 50,
  },
  registerButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
});
