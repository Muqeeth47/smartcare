import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAu7-2mWPT5EyLun1QvtTFPImXDP_JoQEo",
  authDomain: "studio-5671575350-61bbd.firebaseapp.com",
  projectId: "studio-5671575350-61bbd",
  storageBucket: "studio-5671575350-61bbd.firebasestorage.app",
  messagingSenderId: "350139664872",
  appId: "1:350139664872:web:012f3401e59f9096627c5d"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
