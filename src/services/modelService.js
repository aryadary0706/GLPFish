// src/services/predictionService.js
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

const MODEL_API_URL = import.meta.env.VITE_MODEL_API_URL; // siapkan di .env

export const predictionService = {
  /**
   * Kirim imageUrl ke model API, simpan hasil ke Firestore.
   * @param {{ imageUrl: string, imagePath: string }} payload
   * @returns {Promise<{ label: string, confidence: number, id: string }>}
   */
  async predict({ imageUrl, imagePath }) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User belum login");

    // ── Panggil model API ─────────────────────────────────────────────
    // Ganti blok ini saat model siap:
    // const res = await fetch(MODEL_API_URL, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ image_url: imageUrl }),
    // });
    // const data = await res.json();
    // const { label, confidence } = data;
    // ─────────────────────────────────────────────────────────────────

    // Mock sementara — hapus saat API siap
    await new Promise((r) => setTimeout(r, 1200));
    const label = "Segar";
    const confidence = 0.94;

    // Simpan hasil ke Firestore
    const docRef = await addDoc(collection(db, "inspections"), {
      uid,
      imageUrl,
      imagePath,
      label,
      confidence,
      createdAt: serverTimestamp(),
    });

    return { label, confidence, id: docRef.id };
  },
};