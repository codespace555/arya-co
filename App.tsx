import { StatusBar } from 'expo-status-bar';
import AppNavigator from './navigation/AppNavigator';
import 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import "./global.css"
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';
export default function App() {
   const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setIsRegistered(userDoc.exists());
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) return null;
  return (
    <>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
          <Toast />
          <StatusBar style="dark" />
        </NavigationContainer>
      </PaperProvider>
    </>
  );
}
