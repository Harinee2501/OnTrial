// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDR3O-CpzGf3zNpmbXcRFnebSzen56WNxU",
  authDomain: "hiking-app-88eb4.firebaseapp.com",
  projectId: "hiking-app-88eb4",
  storageBucket: "hiking-app-88eb4.firebasestorage.app",
  messagingSenderId: "427952225828",
  appId: "1:427952225828:web:785d15794d2af22f80e2b1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
