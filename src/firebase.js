import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgeXHQ3TFwU7mLg6SVEGIQfzxk_j7wVio",
  authDomain: "generations-calgary.firebaseapp.com",
  projectId: "generations-calgary",
  storageBucket: "generations-calgary.appspot.com",
  messagingSenderId: "102385739589",
  appId: "1:102385739589:web:3f7908107c2a1a8f46402c"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app); 
const db = getFirestore(app);

export { storage, db, auth };
