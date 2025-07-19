// navigation/AppNavigator.tsx
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DrawerNavigator from './DrawerNavigator'; // Admin
import CustomerDrawer from './CustomerDrawer'; // Customer
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { RootStackParamList } from '../types/navigation';
import { Image } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
 const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setRole(userData.role); // 'admin' or 'customer'
          setIsRegistered(true);
        } else {
          setIsRegistered(false);
        }
      } else {
        setRole(null);
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) return null;

  return (
    <Stack.Navigator screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1e40af',
          },
        headerTitle: () => (
          <Image
            source={require('../assets/adaptive-icon.png')} // 👈 Use your logo path here
            style={{ width: 120, height: 40, resizeMode: 'contain' }}
          />
        ),
        headerTitleAlign: 'center', // optional
      }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : !isRegistered ? (
        <Stack.Screen name="Register" component={RegisterScreen} initialParams={{ uid: user?.uid }} />
      ) : role === 'admin' ? (
        <Stack.Screen name="Main" component={DrawerNavigator} />
      ) : (
        <Stack.Screen name="Arya" component={CustomerDrawer} />
      )}
    </Stack.Navigator>
  );
}
