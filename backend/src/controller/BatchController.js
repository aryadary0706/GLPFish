import {
  createBatch,
  getAllBatches,
  getBatchResult,
  updateBatchStatus,
  getBatchDistribution
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
    const result = await getBatchDistribution(jenis, search);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message });
  }
};