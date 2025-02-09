import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAJqGwm7yWyaXb-v_3BO1CjW-Qt1AS6xdc",
  authDomain: "totem-a5b91.firebaseapp.com",
  projectId: "totem-a5b91",
  storageBucket: "totem-a5b91.firebasestorage.app",
  messagingSenderId: "605842547093",
  appId: "1:605842547093:web:447095d846e21fe265969c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
