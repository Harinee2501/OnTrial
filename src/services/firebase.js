// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDrtwwxMdtLgMWaSDs7EQpw-3FJd1Bz5XI",
    authDomain: "ontrail-7d548.firebaseapp.com",
    projectId: "ontrail-7d548",
    storageBucket: "ontrail-7d548.firebasestorage.app",
    messagingSenderId: "917263933128",
    appId: "1:917263933128:web:c72c2c957fee2bdeff4ffd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { auth, db };