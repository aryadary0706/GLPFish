import { supabase } from "../lib/supabase.js";

const formatIndonesianDate = (dateString) => {
  const options = { day: "numeric", month: "long", year: "numeric" };
  return new Date(dateString).toLocaleDateString("id-ID", options);
};

export const createBatch = async (userId, batchData) => {
  const { jenis, tanggal, lokasi, estimasi_jumlah, berat_total, catatan } = batchData;

  const now = new Date();
  const yearMonth = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const randomCounter = Math.floor(100 + Math.random() * 900);
  const generatedId = `B-${yearMonth}-${randomCounter}`;

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
        fish_count: estimasi_jumlah,
        berat_total: berat_total,
        catatan: catatan
      }
    ])
    .select()
    .single();

  if (error) throw error;

  return {
    batch: {
      id: data.id,
      status: data.status,
      jenis: data.fish_category,
      tanggal: data.created_at,
      lokasi: data.lokasi,
      estimasi_jumlah: data.estimasi_jumlah,
      berat_total: data.berat_total,
      catatan: data.catatan
    }
  };
};

export const getAllBatches = async (statusFilter) => {
  let query = supabase
    .from("batches")
    .select(`
      *,
      fishes (
        id,
        prediction_results ( grade )
      )
    `);

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
      avgConfidence: avgConfidence,
      duration: durationStr,
      gradeA: gradeA,
      gradeB: gradeB,
      gradeC: gradeC,
      totalBerat: batch.berat_total || 0,
      fish: fishList
    }
  };
};

export const updateBatchStatus = async (batchId, status) => {
  if (!["saved", "rejected"].includes(status)) {
    throw { status: 400, message: "Status harus 'saved' atau 'rejected'" };
  }

  const { error } = await supabase
    .from("batches")
    .update({ preprocessed_status: status })
    .eq("id", batchId);

  if (error) throw error;

  return {
    success: true,
    message: `Batch status successfully updated to ${status}`
  };
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
    throw { status: 404, message: "Tidak ada ikan di batch ini." };
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
    .eq("user_id", userId);

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