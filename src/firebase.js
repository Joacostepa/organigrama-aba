import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHLCm9AL2-skowPDcT20Qy4-sLH7EqQhg",
  authDomain: "orgama-aba.firebaseapp.com",
  projectId: "orgama-aba",
  storageBucket: "orgama-aba.firebasestorage.app",
  messagingSenderId: "417060435131",
  appId: "1:417060435131:web:842c36c11f8958efb1e59e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
