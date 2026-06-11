import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as batchController from "../controller/BatchController.js";

const router = Router();

router.use(requireAuth);


router.post("/", batchController.addBatch);
router.get("/", batchController.getBatches);
router.get("/distribusi", batchController.getBatchDistributionHandler);
router.get("/:batchId/hasil", batchController.getBatchResultHandler);
router.patch("/:batchId/status", batchController.updateBatchStatusHandler);

export default router;