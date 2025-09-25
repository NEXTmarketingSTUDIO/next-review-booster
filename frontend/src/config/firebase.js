import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBELx_wni2EWXFYCixOEh_Rpat1Jj6L7bQ",
  authDomain: "next-reviews-9d19c.firebaseapp.com",
  projectId: "next-reviews-9d19c",
  storageBucket: "next-reviews-9d19c.firebasestorage.app",
  messagingSenderId: "484223328740",
  appId: "1:484223328740:web:c017c83986734bb49727f1",
  measurementId: "G-5VCKKP9LST"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export default app;
