// src/services/authService.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  setPersistence,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export const authService = {
  async login(email, password) {
    await setPersistence(auth, browserLocalPersistence); 
    return signInWithEmailAndPassword(auth, email, password);
  },

  async register(name, email, password) {
    await setPersistence(auth, browserLocalPersistence); 
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await setDoc(doc(db, "users", credential.user.uid), {
      name,
      email,
      createdAt: new Date(),
    });
    return credential;
  },

  async logout() {
    return signOut(auth);
  },
};