import {
  createBatch,
  getAllBatches,
  getBatchResult,
  updateBatchStatus,
  getBatchDistribution,
  getFishesByBatch,
  getBatchesByUser
}from "../services/batchService.js";


export const addBatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const batchData = req.body;

    const result = await createBatch(userId, batchData);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getBatches = async (req, res) => {
  try {
    const { status } = req.query;

    const result = await getAllBatches(status);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getBatchResultHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    const result = await getBatchResult(batchId);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message });
  }
};

export const updateBatchStatusHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { status } = req.body;

    if (status === "rejected" && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Hanya admin yang dapat menolak batch." });
    }

    const result = await updateBatchStatus(batchId, status);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message });
  }
};

export const getBatchDistributionHandler = async (req, res) => {
  try {
    const { jenis, search } = req.query;
    const { userId } = req.params;

    const result = await getBatchDistribution(jenis, search, userId);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message });
  }
};

export const getFishesByBatchHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    const result = await getFishesByBatch(batchId);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
};

  export const getBatchesByUserIdHandler = async (req, res) => {
  try {
    const { status } = req.query;
    const { userId } = req.params; // Tangkap ID dari URL (contoh: /api/batches/user/123)

    // Opsional (Fitur Keamanan): 
    // Mencegah user A ngintip data user B lewat URL, kecuali dia Admin.
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Akses ditolak" });
    }

    const result = await getBatchesByUser(userId, status);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
