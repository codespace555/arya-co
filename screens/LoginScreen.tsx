import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, firebaseConfig } from '../services/firebase';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [code, setCode] = useState('');
  const recaptchaVerifier = useRef(null);

  const sendVerification = async () => {
    if (!phone) {
      Toast.show({ type: 'error', text1: 'Enter phone number' });
      return;
    }

    try {
      const provider = new PhoneAuthProvider(auth);
      const id = await provider.verifyPhoneNumber(phone, recaptchaVerifier.current!);
      setVerificationId(id);
      Toast.show({ type: 'success', text1: 'OTP sent' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to send OTP'});
    }
  };

  const confirmCode = async () => {
    if (!code) {
      Toast.show({ type: 'error', text1: 'Enter OTP code' });
      return;
    }

    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      Toast.show({ type: 'success', text1: 'Logged in' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Invalid OTP'});
    }
  };

  return (
    <View className="p-4 mt-10">
      <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={firebaseConfig} />
      <TextInput
        className="border p-2 mb-2"
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone number (+91...)"
        keyboardType="phone-pad"
      />
      <TouchableOpacity onPress={sendVerification} className="bg-blue-500 p-2 rounded mb-4">
        <Text className="text-white text-center">Send Code</Text>
      </TouchableOpacity>

      {verificationId ? (
        <>
          <TextInput
            className="border p-2 mb-2"
            value={code}
            onChangeText={setCode}
            placeholder="Enter OTP"
            keyboardType="number-pad"
          />
          <TouchableOpacity onPress={confirmCode} className="bg-green-500 p-2 rounded">
            <Text className="text-white text-center">Confirm</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}
