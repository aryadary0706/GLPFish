// src/services/inspectionService.js

//Untuk fitur History Inspeksi: ambil semua inspeksi user & hapus inspeksi tertentu.
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";

export const inspectionService = {
  async getAll() {
    const uid = auth.currentUser?.uid;
    const q = query(
      collection(db, "inspections"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async delete(id) {
    await deleteDoc(doc(db, "inspections", id));
  },
};