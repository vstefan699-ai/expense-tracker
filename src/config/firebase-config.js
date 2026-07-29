// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAsBEf3obj2fol3b4OjA-57oeL5usnogF0",
  authDomain: "expense-tracker-78e06.firebaseapp.com",
  projectId: "expense-tracker-78e06",
  storageBucket: "expense-tracker-78e06.firebasestorage.app",
  messagingSenderId: "704233263894",
  appId: "1:704233263894:web:9a017330c3d8726d3af637",
  measurementId: "G-V8EGD34KZ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)
// const analytics = getAnalytics(app);


// firebase login
// firebase init
// firebase deploy