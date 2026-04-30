// src/hooks/useInspections.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { inspectionService } from "../services/inspectionService";

export function useInspections() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await inspectionService.getAll();
      setInspections(data || []);
    } catch (err) {
      console.error("Error fetching inspections:", err);
      setError(err.message);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { 
    fetch(); 
  }, [fetch]);

  const remove = useCallback(async (id) => {
    try {
      await inspectionService.delete(id);
      setInspections((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Error deleting inspection:", err);
      setError(err.message);
    }
  }, []);

  return { inspections, loading, error, refetch: fetch, remove };
}