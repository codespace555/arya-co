import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard, // Import Keyboard
  TouchableWithoutFeedback,
  Image, // Import TouchableWithoutFeedback
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons'; // Changed to Ionicons for a different icon
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, firebaseConfig } from '../services/firebase'; // Ensure this path is correct
import Toast from 'react-native-toast-message';

// Use 'nativewind' for Tailwind CSS in React Native.

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const recaptchaVerifier = useRef(null);

  /**
   * Sends a verification code to the user's phone number.
   */
  const sendVerification = async () => {
    if (!phone || phone.length < 10) {
      Toast.show({ type: 'error', text1: 'Please enter a valid 10-digit phone number.' });
      return;
    }
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const id = await phoneProvider.verifyPhoneNumber(
        `+91${phone}`, // Assuming +91 country code
        recaptchaVerifier.current!
      );
      setVerificationId(id);
      Toast.show({ type: 'success', text1: 'Verification code sent!' });
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Failed to send OTP.', text2: 'Please try again later.' });
    }
  };

  /**
   * Confirms the OTP code and signs the user in.
   */
  const confirmCode = async () => {
    if (!code || code.length < 6) {
      Toast.show({ type: 'error', text1: 'Please enter the 6-digit OTP.' });
      return;
    }
    try {
      const credential = PhoneAuthProvider.credential(verificationId!, code);
      await signInWithCredential(auth, credential);
      Toast.show({ type: 'success', text1: '🎉 Welcome!', text2: 'You are now logged in.' });
      // navigation.navigate('Home'); // Navigate to home screen on success
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please check the code and try again.',
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      {/* Updated blue-black gradient */}
      <LinearGradient
        colors={['#1D2B64', '#000000']} // Dark blue to black gradient
        style={StyleSheet.absoluteFill}
      />
      <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={firebaseConfig} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        {/* TouchableWithoutFeedback to dismiss keyboard on tap outside */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 items-center justify-center p-6">
            {/* Decorative Stickers with new icons and animations */}
            {/* <Animatable.Text
              animation="tada"
              easing="ease-in-out"
              iterationCount="infinite"
              delay={1500}
              style={styles.stickerTopLeft}>
              ✨
            </Animatable.Text>
            <Animatable.Text
              animation="swing"
              easing="ease-in-out"
              iterationCount="infinite"
              delay={1800}
              style={styles.stickerBottomRight}>
              🎉
            </Animatable.Text> */}

            {/* Logo Section with new icon and animations */}
            <Animatable.View animation="fadeInDown" duration={1200} className="mb-12 items-center">
              <Animatable.View
                animation="pulse"
                easing="ease-in-out"
                iterationCount="infinite"
                className="rounded-full bg-white/20 p-5">
                {/* Using Ionicons as a stand-in for a "mithai" icon. You can replace this with a custom Image component. */}
                <Image source={require('../assets/aryaco.png')} className="h-20 w-20" />

                {/* <Ionicons name="gift-sharp" size={80} color="white" /> */}
              </Animatable.View>
              <Animatable.Text
                animation="fadeIn"
                delay={500}
                className="mt-4 text-4xl font-extrabold text-white"
                style={styles.textShadow}>
                Arya & Co
              </Animatable.Text>
              <Animatable.Text
                animation="fadeIn"
                delay={800}
                className="mt-1 text-lg text-white/80"
                style={styles.textShadow}>
                Login with your Phone
              </Animatable.Text>
            </Animatable.View>

            {/* Form Section with staggered animations */}
            <Animatable.View animation="fadeInUp" duration={1000} delay={500} className="w-full">
              {!verificationId ? (
                // Phone Input View
                <View>
                  <Animatable.View animation="fadeInUp" delay={700}>
                    <View className="mb-4 w-full flex-row items-center rounded-2xl border border-white/30 bg-black/20 p-4">
                      <Feather name="phone" size={20} color="white" />
                      <TextInput
                        className="ml-4 flex-1 text-base text-white"
                        placeholder="Your 10-Digit Phone Number"
                        placeholderTextColor="#FFFFFF90"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phone}
                        onChangeText={setPhone}
                        autoComplete="tel"
                      />
                    </View>
                  </Animatable.View>
                  <Animatable.View animation="fadeInUp" delay={900}>
                    <TouchableOpacity
                      onPress={sendVerification}
                      className="w-full flex-row items-center justify-center rounded-2xl bg-white p-4 shadow-lg"
                      style={styles.buttonShadow}>
                      <Text className="mr-2 text-base font-bold text-blue-600">
                        Send Verification Code
                      </Text>
                      <Feather name="arrow-right-circle" size={20} color="#2563eb" />
                    </TouchableOpacity>
                  </Animatable.View>
                </View>
              ) : (
                // OTP Input View
                <View>
                  <Animatable.View animation="fadeInUp" delay={200}>
                    <View className="mb-4 w-full flex-row items-center rounded-2xl border border-white/30 bg-black/20 p-4">
                      <Feather name="key" size={20} color="white" />
                      <TextInput
                        className="ml-4 flex-1 text-base text-white"
                        placeholder="Enter 6-Digit OTP"
                        placeholderTextColor="#FFFFFF90"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={code}
                        onChangeText={setCode}
                      />
                    </View>
                  </Animatable.View>
                  <Animatable.View animation="fadeInUp" delay={400}>
                    <TouchableOpacity
                      onPress={confirmCode}
                      className="w-full flex-row items-center justify-center rounded-2xl bg-green-500 p-4 shadow-lg"
                      style={styles.buttonShadow}>
                      <Text className="mr-2 text-base font-bold text-white">Confirm & Login</Text>
                      <Feather name="check-circle" size={20} color="white" />
                    </TouchableOpacity>
                  </Animatable.View>
                  <Animatable.View animation="fadeIn" delay={800}>
                    <TouchableOpacity onPress={() => setVerificationId(null)} className="mt-6">
                      <Text
                        className="text-center text-base text-white/80"
                        style={styles.textShadow}>
                        Use a different phone number?
                      </Text>
                    </TouchableOpacity>
                  </Animatable.View>
                </View>
              )}
            </Animatable.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  textShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  stickerTopLeft: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    fontSize: 40,
    transform: [{ rotate: '-15deg' }],
  },
  stickerBottomRight: {
    position: 'absolute',
    bottom: '15%',
    right: '10%',
    fontSize: 40,
    transform: [{ rotate: '15deg' }],
  },
});
