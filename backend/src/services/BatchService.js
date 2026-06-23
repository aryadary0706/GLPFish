import { supabase } from "../lib/supabase.js";

const formatIndonesianDate = (dateString) => {
  const options = { day: "numeric", month: "long", year: "numeric" };
  return new Date(dateString).toLocaleDateString("id-ID", options);
};

// Helper: generate batch ID dengan format B-YYMM-NNNN (4 digit), retry kalau collision.
const generateBatchId = () => {
  const now = new Date();
  const yearMonth = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  // Range 1000-9999 → 9000 ID per bulan (sebelumnya cuma 900).
  const counter = Math.floor(1000 + Math.random() * 9000);
  return `B-${yearMonth}-${counter}`;
};

export const createBatch = async (userId, batchData) => {
  const { jenis, tanggal, lokasi, estimasi_jumlah, berat_total, catatan } = batchData;

  // Validasi estimasi minimal 1 ikan.
  const estimasi = Number(estimasi_jumlah);
  if (!Number.isFinite(estimasi) || estimasi < 1) {
    throw { status: 400, message: "estimasi_jumlah harus angka >= 1." };
  }

  // berat_total: terima angka desimal dari user, tapi DB kolom INTEGER → round.
  // (Migrasi ke numeric direkomendasikan; sementara round agar tidak error type.)
  const beratInt = Math.max(0, Math.round(Number(berat_total) || 0));

  // Retry up to 5x kalau ada duplicate ID (collision rate sangat rendah dengan 4 digit).
  let lastError = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const generatedId = generateBatchId();
    const { data, error } = await supabase
      .from("batches")
      .insert([
        {
          id: generatedId,
          user_id: userId,
          fish_category: jenis,
          created_at: tanggal || new Date().toISOString(),
          status: "pending",
          preprocessed_status: "incomplete",
          lokasi: lokasi,
          fish_count: estimasi,
          berat_total: beratInt,
          catatan: catatan
        }
      ])
      .select()
      .single();

    if (!error) {
      return {
        batch: {
          id: data.id,
          status: data.status,
          jenis: data.fish_category,
          tanggal: data.created_at,
          lokasi: data.lokasi,
          estimasi_jumlah: data.fish_count,
          berat_total: data.berat_total,
          catatan: data.catatan
        }
      };
    }

    lastError = error;
    // Retry hanya kalau primary key conflict (kode 23505 di Postgres).
    if (error.code !== "23505") break;
  }

  throw lastError || new Error("Gagal membuat batch setelah beberapa percobaan");
};

export const getAllBatches = async (statusFilter, userId, isAdmin = false) => {
  let query = supabase
    .from("batches")
    .select(`
      *,
      fishes (
        id,
        prediction_results ( grade )
      )
    `)
    .order("created_at", { ascending: false });

  // Non-admin hanya boleh lihat batch miliknya sendiri.
  if (!isAdmin && userId) {
    query = query.eq("user_id", userId);
  }

  if (statusFilter) {
    query = query.eq("preprocessed_status", statusFilter);
  }

  const { data: batches, error } = await query;
  if (error) throw error;

  const formattedBatches = batches.map(batch => {
    let gradeA = 0, gradeB = 0, gradeC = 0;
    let totalProses = 0;

    if (batch.fishes) {
      batch.fishes.forEach(fish => {
        const pred = Array.isArray(fish.prediction_results)
          ? fish.prediction_results[0]
          : fish.prediction_results;

        if (pred && pred.grade) {
          totalProses++;
          const grade = pred.grade.toUpperCase();
          if (grade === "A") gradeA++;
          else if (grade === "B") gradeB++;
          else if (grade === "C") gradeC++;
        }
      });
    }

    return {
      id: batch.id,
      jenis: batch.fish_category,
      tanggal: batch.created_at,
      status: batch.preprocessed_status,
      gradeA,
      gradeB,
      gradeC,
      total: totalProses,
      total_uploaded: batch.fishes ? batch.fishes.length : 0,
      berat: batch.berat_total || 0,
      estimasi_jumlah: batch.estimasi_jumlah || batch.fish_count || 0
    };
  });

  return { batches: formattedBatches };
};

export const getBatchResult = async (batchId) => {
  const { data: batch, error } = await supabase
    .from("batches")
    .select(`
      *,
      fishes (
        id,
        fish_index,
        eye_image:images!fishes_eye_image_fk ( storage_path ),
        prediction_results ( 
          grade, 
          confidence_score, 
          predicted_at 
        )
      )
    `)
    .eq("id", batchId)
    .single();

  if (error) {
    throw { status: 500, message: `Supabase Error: ${error.message} (${error.details})` };
  }
  if (!batch) {
    throw { status: 404, message: "Batch tidak ditemukan di DB" };
  }

  let gradeA = 0, gradeB = 0, gradeC = 0;
  let totalConfidence = 0;
  let totalIkanProses = 0;
  let fishList = [];
  let timestamps = [];

  if (batch.fishes && batch.fishes.length > 0) {
    batch.fishes.sort((a, b) => (a.fish_index || 0) - (b.fish_index || 0));

    batch.fishes.forEach(fish => {
      const pred = Array.isArray(fish.prediction_results)
        ? fish.prediction_results[0]
        : fish.prediction_results;

      if (pred && pred.grade) {
        totalIkanProses++;
        
        const grade = pred.grade.toUpperCase();
        if (grade === "A") gradeA++;
        else if (grade === "B") gradeB++;
        else gradeC++;

        const confidence = pred.confidence_score ? Math.round(pred.confidence_score * 100) : 0;
        totalConfidence += confidence;

        if (pred.predicted_at) {
          timestamps.push(new Date(pred.predicted_at));
        }

        let imageUrl = null;
        if (fish.eye_image?.storage_path) { 
          const { data: publicUrlData } = supabase.storage
            .from("images") 
            .getPublicUrl(fish.eye_image.storage_path);
          imageUrl = publicUrlData?.publicUrl || null;
        }

        fishList.push({
          id: fish.id,
          name: `fish #${fish.fish_index || totalIkanProses}`,
          grade: grade,
          confidence: confidence,
          imageUrl: imageUrl
        });
      }
    });
  }

  const avgConfidence = totalIkanProses > 0 ? Math.round(totalConfidence / totalIkanProses) : 0;

  let durationStr = "00:00";
  if (timestamps.length > 1) {
    const minTime = new Date(Math.min(...timestamps));
    const maxTime = new Date(Math.max(...timestamps));
    const diffMs = maxTime - minTime;

    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    durationStr = `${minutes}:${seconds}`;
  }

  return {
    grading: {
      batchId: batch.id,
      jenis: batch.fish_category,
      totalIkan: totalIkanProses,
      estimasi: batch.fish_count || 0,
      avgConfidence: avgConfidence,
      duration: durationStr,
      gradeA: gradeA,
      gradeB: gradeB,
      gradeC: gradeC,
      totalBerat: batch.berat_total || 0,
      status: batch.status,
      preprocessedStatus: batch.preprocessed_status,
      rejectReason: batch.reject_reason || null,
      fish: fishList
    }
  };
};

// Cek apakah error Supabase berhubungan dengan kolom reject_reason yang belum ada
// atau schema cache PostgREST yang stale.
const isRejectReasonSchemaError = (err) => {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  return (
    err.code === "PGRST204" ||
    err.code === "PGRST205" ||
    msg.includes("reject_reason") ||
    msg.includes("schema cache")
  );
};

export const updateBatchStatus = async (batchId, status, rejectReason) => {
  if (!["saved", "rejected"].includes(status)) {
    throw { status: 400, message: "Status harus 'saved' atau 'rejected'" };
  }

  const basePayload = { preprocessed_status: status };
  const fullPayload = { ...basePayload };
  if (status === "rejected") {
    fullPayload.reject_reason = rejectReason?.trim() || null;
  } else {
    // Bersihkan reason kalau status dipindah dari rejected → saved
    fullPayload.reject_reason = null;
  }

  // Coba update dengan reject_reason. Kalau kolomnya belum ada / schema cache stale,
  // fallback ke update tanpa reject_reason — supaya reject tidak ter-block.
  let { error } = await supabase
    .from("batches")
    .update(fullPayload)
    .eq("id", batchId);

  let fallbackUsed = false;
  if (error && isRejectReasonSchemaError(error)) {
    fallbackUsed = true;
    console.warn(
      `[updateBatchStatus] Kolom reject_reason tidak tersedia (${error.code || "?"}: ${error.message}). ` +
      `Fallback: simpan status saja. Jalankan SQL: ALTER TABLE batches ADD COLUMN reject_reason TEXT; lalu NOTIFY pgrst, 'reload schema';`
    );
    const retry = await supabase
      .from("batches")
      .update(basePayload)
      .eq("id", batchId);
    error = retry.error;
  }

  if (error) throw error;

  const reasonProvided = status === "rejected" && !!fullPayload.reject_reason;
  const result = {
    success: true,
    message: `Batch status successfully updated to ${status}`,
    reject_reason_saved: reasonProvided && !fallbackUsed,
  };
  if (reasonProvided && fallbackUsed) {
    result.warning = "Alasan reject tidak tersimpan: kolom reject_reason belum ada di database. Jalankan migrasi.";
  }
  return result;
};

export const getBatchDistribution = async (jenis, search, userId) => {
  let query = supabase.from("batches").select(`
      *,
      fishes (
        id,
        prediction_results ( grade )
      )
    `)
    .eq("user_id", userId);

  if (jenis) {
    query = query.eq("fish_category", jenis);
  }
  if (search) {
    query = query.ilike("id", `%${search}%`);
  }

  const { data: batches, error } = await query;
  if (error) throw error;

  let totalBatch = batches.length;
  let totalIkanGlobal = 0;
  let globalGradeA = 0;
  let rejectedBatchCount = 0;

  const formattedBatches = batches.map((batch) => {
    let gradeA = 0, gradeB = 0, gradeC = 0;
    let totalIkanBatch = 0;

    if (batch.fishes && batch.fishes.length > 0) {
      batch.fishes.forEach((fish) => {
        const pred = Array.isArray(fish.prediction_results)
          ? fish.prediction_results[0]
          : fish.prediction_results;

        if (pred && pred.grade) {
          totalIkanBatch++;
          const grade = pred.grade.toUpperCase();

          if (grade === "A") gradeA++;
          else if (grade === "B") gradeB++;
          else if (grade === "C") gradeC++;
        }
      });
    }

    totalIkanGlobal += totalIkanBatch;
    globalGradeA += gradeA;

    if (batch.preprocessed_status === "rejected") rejectedBatchCount++;

    return {
      id: batch.id,
      date: formatIndonesianDate(batch.created_at),
      jenis: batch.fish_category,
      gradeA,
      gradeB,
      gradeC,
      total: totalIkanBatch,
      berat: parseFloat(batch.berat_total || 0),
      status: batch.preprocessed_status || batch.status,
    };
  });

  const gradeAPercent = totalIkanGlobal > 0 ? Math.round((globalGradeA / totalIkanGlobal) * 100) : 0;
  const rejectPercent = totalBatch > 0 ? Math.round((rejectedBatchCount / totalBatch) * 100) : 0;

  return {
    stats: {
      totalBatch,
      totalIkan: totalIkanGlobal,
      gradeAPercent,
      rejectPercent,
      rejectedBatchCount,
    },
    batches: formattedBatches,
  };
};

export const getFishesByBatch = async (batchId) => {
  const { data, error } = await supabase
    .from("fishes")
    .select(`
      id,
      fish_index,
      status,
      eye_image:images!fishes_eye_image_fk ( storage_path ),
      gill_image:images!fishes_gill_image_fk ( storage_path ),
      prediction_results (
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
    `)
    .eq("batch_id", batchId)
    .order("fish_index", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) {
    return { fishes: [] };
  }

  const fishes = data.map((fish) => {
    const pred = Array.isArray(fish.prediction_results)
      ? fish.prediction_results[0]
      : fish.prediction_results || null;
      
    let eyeImageUrl = null;
    if (fish.eye_image?.storage_path) {
      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fish.eye_image.storage_path);
      eyeImageUrl = urlData?.publicUrl || null;
    }

    let gillImageUrl = null;
    if (fish.gill_image?.storage_path) {
      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fish.gill_image.storage_path);
      gillImageUrl = urlData?.publicUrl || null;
    }

    return {
      id: fish.id,
      fish_index: fish.fish_index,
      status: fish.status,
      eye_image_url: eyeImageUrl,
      gill_image_url: gillImageUrl,
      prediction_results: pred
        ? {
          grade: pred.grade,
          label_text: pred.label_text,
          exportable: pred.exportable,
          confidence_score: pred.confidence_score
            ? Math.round(pred.confidence_score * 100)
            : 0,
          eyes_status: pred.eyes_status,
          eyes_confidence_score: pred.eyes_confidence_score
            ? Math.round(pred.eyes_confidence_score * 100)
            : 0,
          gill_status: pred.gill_status,
          gill_confidence_score: pred.gill_confidence_score
            ? Math.round(pred.gill_confidence_score * 100)
            : 0,
          predicted_at: pred.predicted_at,
        }
        : null,
    };
  });

  return { fishes };
};

export const getBatchesByUser = async (userId, statusFilter) => {
  let query = supabase
    .from("batches")
    .select(`
      *,
      fishes (
        id,
        prediction_results ( grade )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("preprocessed_status", statusFilter);
  }

  const { data: batches, error } = await query;
  if (error) throw error;

  const formattedBatches = batches.map(batch => {
    let gradeA = 0, gradeB = 0, gradeC = 0;
    let totalProses = 0;

    if (batch.fishes) {
      batch.fishes.forEach(fish => {
        const pred = Array.isArray(fish.prediction_results)
          ? fish.prediction_results[0]
          : fish.prediction_results;

        if (pred && pred.grade) {
          totalProses++;
          const grade = pred.grade.toUpperCase();
          if (grade === "A") gradeA++;
          else if (grade === "B") gradeB++;
          else if (grade === "C") gradeC++;
        }
      });
    }

    return {
      id: batch.id,
      jenis: batch.fish_category,
      tanggal: batch.created_at,
      status: batch.preprocessed_status,
      gradeA,
      gradeB,
      gradeC,
      total: totalProses,
      total_uploaded: batch.fishes ? batch.fishes.length : 0,
      berat: batch.berat_total || 0,
      estimasi_jumlah: batch.estimasi_jumlah || batch.fish_count || 0
    };
  });

  return { batches: formattedBatches };
};