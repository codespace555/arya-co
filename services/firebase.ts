import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth} from 'firebase/auth';


 
export const firebaseConfig = {
  apiKey: "AIzaSyC5sBwtUvGpkm8YPvtc3ulCcvTevigExdQ",
   authDomain: "arayandco-ea566.firebaseapp.com",
  projectId: "arayandco-ea566",
  storageBucket: "arayandco-ea566.firebasestorage.app",
  messagingSenderId: "577762527657",
  appId: "1-577762527657-ios-9db859613ab5f212171cb8",
  measurementId: "G-B9LYSHHCYV"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)


export const db = getFirestore(app);
