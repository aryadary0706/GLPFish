import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getUser, changePassword, updateUserProfile } from '../controller/UserController.js';

const router = Router()

router.use(requireAuth);

router.put("/update-password", changePassword);
router.get("/me",  getUser);
router.put("/update", updateUserProfile)

export default router