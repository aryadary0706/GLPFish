// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { authService } from "../services/authService";

export const AuthContext = createContext(null);

const ERROR_MAP = {
  "auth/user-not-found": "Email tidak terdaftar",
  "auth/wrong-password": "Password salah",
  "auth/invalid-credential": "Email atau password salah",
  "auth/email-already-in-use": "Email sudah digunakan",
  "auth/weak-password": "Password minimal 6 karakter",
  "auth/invalid-email": "Format email tidak valid",
  "auth/too-many-requests": "Terlalu banyak percobaan, coba lagi nanti",
  "auth/network-request-failed": "Tidak ada koneksi internet",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(
        firebaseUser
          ? {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
              email: firebaseUser.email,
            }
          : null
      );
      setInitializing(false);
    });
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
      return { success: true };
    } catch (err) {
      const msg = ERROR_MAP[err.code] ?? "Terjadi kesalahan, coba lagi";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    setLoading(true);
    setError(null);
    try {
      await authService.register(name, email, password);
      return { success: true };
    } catch (err) {
      const msg = ERROR_MAP[err.code] ?? "Terjadi kesalahan, coba lagi";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => authService.logout(), []);
  const clearError = useCallback(() => setError(null), []);

  if (initializing) return null; // <= bisa diganti untuk page spinner render halaman yang akan ditampilkan

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}