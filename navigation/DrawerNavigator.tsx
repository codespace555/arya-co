import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DrawerNavigator from './DrawerNavigator'; // Admin
import CustomerDrawer from './CustomerDrawer'; // Customer
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    let firestoreUnsubscribe: (() => void) | undefined;

    // Subscribe to auth state changes
    const authUnsubscribe = auth().onAuthStateChanged((authUser) => {
      // Unsubscribe previous Firestore listener if any
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
        firestoreUnsubscribe = undefined;
      }

      setUser(authUser);

      if (authUser) {
        // Listen for changes in user document in Firestore
        firestoreUnsubscribe = firestore()
          .collection('users')
          .doc(authUser.uid)
          .onSnapshot((docSnap) => {
            if (docSnap.exists) {
              const userData = docSnap.data();
              setRole(userData?.role ?? null);
              setIsRegistered(true);
            } else {
              setRole(null);
              setIsRegistered(false);
            }
            if (initializing) {
              setInitializing(false);
            }
          });
      } else {
        setRole(null);
        setIsRegistered(false);
        if (initializing) {
          setInitializing(false);
        }
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
    };
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050816' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

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
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ gestureEnabled: false }} />
        </>
      ) : !isRegistered ? (
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          initialParams={{ uid: user.uid }}
          options={{ gestureEnabled: false }}
        />
      ) : role === 'admin' ? (
        <Stack.Screen name="Main" component={DrawerNavigator} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="Arya" component={CustomerDrawer} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
