import {
  getAllInspections,
  getInspectionById,
} from "../services/InspectionService.js";
import { QualityPred } from "../services/PredictAI.js";

export const getInspections = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getAllInspections(userId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[getInspections Error]", err.message);
    return res.status(err.status || 500).json({ error: err.message || "Terjadi kesalahan" });
  }
};

export const getInspectionDetails = async (req, res) => {
  try {
    const inspectionId = req.params.id;
    const user = req.user;

    const result = await getInspectionById(inspectionId, user);
    
    if (result.status !== 200) {
      return res.status(result.status).json({ error: result.message });
    }
    
    return res.status(200).json(result);
  } catch (err) {
    console.error("[getInspectionDetails Error]", err.message);
    return res.status(err.status || 500).json({ error: err.message || "Terjadi kesalahan" });
  }
};

export const predictBatch = async (req, res) => {
  const { batch_id } = req.body;
  if (!batch_id) {
    return res.status(400).json({ error: "batch_id wajib disertakan." });
  }

  try {
    const result = await QualityPred(batch_id);
    const statusCode = result.success ? 201 : 500;

    if (result.errors && result.errors.length === 0) {
      delete result.errors;
    }

    return res.status(statusCode).json(result);
  } catch (err) {
    console.error("[upload/predict]", err.message);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
};