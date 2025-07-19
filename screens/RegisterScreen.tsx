import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ route, navigation }: Props) {
  const { uid } = route.params;

  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'customer'>('customer');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const userPhone = auth.currentUser?.phoneNumber;
    if (userPhone) setPhone(userPhone);
  }, []);

  const handleRegister = async () => {
    if (!name || !phone) {
      return Alert.alert('Error', 'Name and phone number are required');
    }

    try {
      await setDoc(doc(db, 'users', uid), {
        uid,
        name,
        phone,
        role : "customer",
        createdAt: new Date(),
      });

      if (role === 'admin') {
        navigation.replace('Main', {
          screen: 'Dashboard',
        });
      } else {
        navigation.replace('Arya', {
          screen: 'Home',
        });
      }
    } catch (err) {
      console.error('Error saving user:', err);
      Alert.alert('Error', 'Failed to save user data');
    }
  };

  return (
    <KeyboardAvoidingView>
      <View style={{ padding: 20, marginTop: 50 }}>
        <Text>Name</Text>
        <TextInput
          placeholder="Enter name"
          value={name}
          onChangeText={setName}
          style={{ borderWidth: 1, padding: 10, marginBottom: 15 }}
        />

        <Text>Phone</Text>
        <TextInput
          placeholder="Phone"
          value={phone}
          editable={false}
          style={{ borderWidth: 1, padding: 10, marginBottom: 15, backgroundColor: '#eee' }}
        />
        <Text>Adress</Text>
        <TextInput
          placeholder="Enter Adrees"
          value={address}
          onChangeText={setAddress}
          style={{ borderWidth: 1, padding: 10, marginBottom: 15 }}
        />
        

        <TouchableOpacity
          onPress={handleRegister}
          style={{ backgroundColor: 'black', padding: 10 }}>
          <Text style={{ color: 'white', textAlign: 'center' }}>Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
