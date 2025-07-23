// firebaseConfig.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import firebaseApp from '@react-native-firebase/app';

// No need to call initializeApp manually — it's done automatically if `google-services.json` / `GoogleService-Info.plist` is in place.

export const authInstance = auth();
export const db = firestore();
