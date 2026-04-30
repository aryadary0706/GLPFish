// src/hooks/useInspections.js
import { useState, useEffect, useCallback } from "react";
import { inspectionService } from "../services/inspectionService";

export function useInspections() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await inspectionService.getAll();
    setInspections(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = useCallback(async (id) => {
    await inspectionService.delete(id);
    setInspections((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { inspections, loading, refetch: fetch, remove };
}