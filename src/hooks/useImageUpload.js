// src/hooks/useImageUpload.js
import { useState, useCallback } from "react";
import { storageService } from "../services/storageService";
import { predictionService } from "../services/modelService";

export function useImageUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null); // { label, confidence, imageUrl, id }
  const [error, setError] = useState(null);

  const upload = useCallback(async (file) => {
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      // 1. Upload ke Storage
      const { url, path } = await storageService.upload(file, setProgress);

      // 2. Kirim ke model API & simpan ke Firestore
      const prediction = await predictionService.predict({
        imageUrl: url,
        imagePath: path,
      });

      setResult({ ...prediction, imageUrl: url });
      return { success: true, ...prediction, imageUrl: url };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  return { upload, progress, uploading, result, error };
}