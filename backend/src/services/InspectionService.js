import { supabase } from "../lib/supabase.js";

export const getAllInspections = async (userId) => {
  const { data, error } = await supabase
    .from("images")
    .select(`
      id,
      file_name,
      storage_path,
      uploaded_at,
      user_id,
      fishes!eye_image_id!inner (
        prediction_results!inner (
          grade,
          label_text,
          exportable,
          confidence_score,
          eyes_status,
          eyes_confidence_score,
          gill_status,
          gill_confidence_score,
          predicted_at
        )
      )
    `)
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;

  const formattedInspections = data.map((img) => {
    const pred = img.fishes?.[0]?.prediction_results?.[0] || null;

    return {
      id: img.id,
      file_name: img.file_name,
      storage_path: img.storage_path,
      uploaded_at: img.uploaded_at,
      prediction_results: pred ? {
        grade: pred.grade,
        label_text: pred.label_text,
        warna: pred.warna || "",
        exportable: pred.exportable,
        confidence_score: pred.confidence_score ? Math.round(pred.confidence_score * 100) : 0,
        eyes_status: pred.eyes_status,
        eyes_confidence_score: pred.eyes_confidence_score ? Math.round(pred.eyes_confidence_score * 100) : 0,
        gill_status: pred.gill_status,
        gill_confidence_score: pred.gill_confidence_score ? Math.round(pred.gill_confidence_score * 100) : 0,
        predicted_at: pred.predicted_at
      } : null
    };
  }).filter(item => item.prediction_results !== null);

  return { inspections: formattedInspections };
};

export const getInspectionById = async (inspectionId, currentUser) => {
  const { data, error } = await supabase
    .from("images")
    .select(`
      id,
      file_name,
      storage_path,
      uploaded_at,
      user_id,
      fishes!eye_image_id!inner (
        gill_image:images!fishes_gill_image_fk (
          storage_path
        ),
        prediction_results!inner (
          grade,
          label_text,
          exportable,
          confidence_score,
          eyes_status,
          eyes_confidence_score,
          gill_status,
          gill_confidence_score,
          waktu_proses_ms,
          predicted_at
        )
      )
    `)
    .eq("id", inspectionId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return { 
      status: 404, 
      message: "Data inspeksi tidak ditemukan." 
    };
  }

  if (currentUser.role !== 'admin' && data.user_id !== currentUser.id) {
    return { 
      status: 403, 
      message: "Anda tidak memiliki hak akses untuk melihat data inspeksi ini." 
    };
  }

  const fishData = data.fishes?.[0] || {};
  const pred = fishData.prediction_results?.[0] || null;
  const gillStoragePath = fishData.gill_image?.storage_path || null;

  const formattedDetail = {
    id: data.id,
    file_name: data.file_name,
    storage_path: data.storage_path,
    storage_path_gill: gillStoragePath,
    uploaded_at: data.uploaded_at,
    prediction_results: pred ? {
      grade: pred.grade,
      label_text: pred.label_text,
      warna: pred.warna || "",
      exportable: pred.exportable,
      confidence_score: pred.confidence_score ? Math.round(pred.confidence_score * 100) : 0,
      eyes_status: pred.eyes_status,
      eyes_confidence_score: pred.eyes_confidence_score ? Math.round(pred.eyes_confidence_score * 100) : 0,
      gill_status: pred.gill_status,
      gill_confidence_score: pred.gill_confidence_score ? Math.round(pred.gill_confidence_score * 100) : 0,
      waktu_proses_ms: pred.waktu_proses_ms,
      predicted_at: pred.predicted_at
    } : null,
    raw_output: null
  };

  return { status: 200, inspection: formattedDetail };
};