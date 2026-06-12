import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as batchController from "../controller/BatchController.js";

const router = Router();

router.use(requireAuth);

router.post("/", batchController.addBatch);
router.get("/", batchController.getBatches);
// router.get("/distribusi", batchController.getBatchDistributionHandler);

// 💥 PERUBAHAN DI SINI: 
// Cukup pakai 1 baris ini untuk distribusi, dan arahkan ke getBatchDistributionHandler
router.get("/distribusi/user/:userId", batchController.getBatchDistributionHandler);

router.get("/user/:userId", batchController.getBatchesByUserIdHandler);
router.get("/:batchId/hasil", batchController.getBatchResultHandler);
router.patch("/:batchId/status", batchController.updateBatchStatusHandler);
router.get("/:batchId/fishes", batchController.getFishesByBatchHandler);

export default router;