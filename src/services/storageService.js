// src/services/storageService.js
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export const storageService = {
  validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.type))
      return { valid: false, error: "Format tidak didukung. Gunakan JPG, PNG, atau WEBP." };
    if (file.size > MAX_SIZE)
      return { valid: false, error: "Ukuran file maksimal 5MB." };
    return { valid: true };
  },

  /**
   * Upload file ke Firebase Storage dengan progress callback.
   * @param {File} file
   * @param {(progress: number) => void} onProgress
   * @returns {Promise<{ url: string, path: string }>}
   */
  async upload(file, onProgress) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User belum login");

    const validation = this.validateFile(file);
    if (!validation.valid) throw new Error(validation.error);

    const path = `inspections/${uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress?.(pct);
        },
        reject,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, path });
        }
      );
    });
  },
};