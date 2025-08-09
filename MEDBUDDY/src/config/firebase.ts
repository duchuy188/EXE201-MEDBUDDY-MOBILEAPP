import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration từ google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyBmF5p48eSdZsFZI7qedhJMoSXOqB3QrkA",
  authDomain: "medbuddy-ccb1c.firebaseapp.com",
  projectId: "medbuddy-ccb1c",
  storageBucket: "medbuddy-ccb1c.firebasestorage.app",
  messagingSenderId: "148297263599",
  appId: "1:148297263599:android:92006714cb778044f02e1a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
