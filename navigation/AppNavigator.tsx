import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DrawerNavigator from './DrawerNavigator'; // Admin
import CustomerDrawer from './CustomerDrawer'; // Customer
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { RootStackParamList } from '../types/navigation';
import { View, Text, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const checkUserRegistration = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setRole(userData.role); // 'admin' or 'customer'
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }
    } catch (err) {
      console.error('Failed to fetch user role', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // This listener will react to changes in the user's document
        const userDocRef = doc(db, 'users', user.uid);
        const docUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setRole(userData.role);
            setIsRegistered(true);
          } else {
            setIsRegistered(false);
          }
        });
        // We will need to unsubscribe from this listener when the component unmounts
        return () => docUnsubscribe();
      } else {
        setUser(null);
        setRole(null);
        setIsRegistered(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (initializing) {
    // A simple loading indicator for a better UX during initialization
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050816' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        // Applying the stylish dark theme from HomeScreen
        headerStyle: { backgroundColor: '#050816' },
        headerTintColor: '#fff', // Sets the back button color to white
        headerTitleStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerTitleAlign: 'center',
      }}
    >
      {!user ? (
        // Login and Register screens will have the styled header
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !isRegistered ? (
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          initialParams={{ uid: user?.uid }}
        />
      ) : role === 'admin' ? (
        <Stack.Screen
          name="Main"
          component={DrawerNavigator}
          options={{ headerShown: false }} // Hide header to prevent double headers
        />
      ) : (
        <Stack.Screen
          name="Arya"
          component={CustomerDrawer}
          options={{ headerShown: false }} // Hide header to prevent double headers
        />
      )}
    </Stack.Navigator>
  );
}