import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DrawerNavigator from './DrawerNavigator'; // Admin
import CustomerDrawer from './CustomerDrawer'; // Customer
import { auth, db } from '../services/firebase'; // Correct path to your firebase config
import { RootStackParamList } from '../types/navigation'; // Correct path to your types

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // This will hold the unsubscribe function for the Firestore listener
    let firestoreUnsubscribe: () => void = () => {};

    // Listen for changes to the user's authentication state
    const authUnsubscribe = onAuthStateChanged(auth, (authUser) => {
      // Unsubscribe from any previous Firestore listener
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }

      setUser(authUser);

      if (authUser) {
        // If user is logged in, listen for changes to their user document
        const userDocRef = doc(db, 'users', authUser.uid);
        firestoreUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setRole(userData.role);
            setIsRegistered(true);
          } else {
            // User is authenticated but doesn't have a document in Firestore
            setRole(null);
            setIsRegistered(false);
          }
          // We have checked the user's status, so we can stop initializing
          if (initializing) {
            setInitializing(false);
          }
        });
      } else {
        // User is logged out, clear all user-related state
        setRole(null);
        setIsRegistered(false);
        if (initializing) {
          setInitializing(false);
        }
      }
    });

    // Return a cleanup function to unsubscribe from all listeners on unmount
    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount

  // Show a loading indicator while we check for user authentication
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050816' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Render the correct navigator based on the user's state
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#050816' },
        headerTintColor: '#fff',
        headerTitleStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerTitleAlign: 'center',
      }}
    >
      {!user ? (
        // If no user is logged in, show the authentication screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ gestureEnabled: false }}/>
        </>
      ) : !isRegistered ? (
        // If user is logged in but not registered in Firestore, show Register screen
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          initialParams={{ uid: user.uid }}
          options={{ gestureEnabled: false }}
        />
      ) : role === 'admin' ? (
        // If user is an admin, show the admin drawer navigator
        <Stack.Screen
          name="Main"
          component={DrawerNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        // If user is a customer, show the customer drawer navigator
        <Stack.Screen
          name="Arya"
          component={CustomerDrawer}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}
