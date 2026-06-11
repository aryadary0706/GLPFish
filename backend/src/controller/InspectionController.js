import {
  getAllInspections,
  getInspectionById,
} from "../services/inspectionService.js";
import { QualityPred } from "../services/PredictAI.js";

export const getInspections = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getAllInspections(userId);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || 500;
    if (result.status !== 200) {
      return res.status(result.status).json({ error: result.message });
    }
    return res.status(200).json({ inspection: result.inspection });
  }
};

export const getInspectionDetails = async (req, res) => {
  try {
    const inspectionId = req.params.id;
    const userId = req.user;

    const result = await getInspectionById(inspectionId, userId);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || 500;
    if (result.status !== 200) {
      return res.status(result.status).json({ error: result.message });
    }
    return res.status(200).json({ inspection: result.inspection });
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

    await supabase
      .from("batches")
      .update({ status: "failed", preprocessed_status: "rejected" })
      .eq("id", batch_id);

    return res.status(status).json({ error: err.message });
  }
};
