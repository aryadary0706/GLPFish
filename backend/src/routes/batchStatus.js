import { supabase } from '../lib/supabase.js'
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// PATCH /api/batches/:batchId/status
router.patch('/:batchId/status', requireAuth, async (req, res) => {
  try {
    const { batchId } = req.params;
    const { status } = req.body;

    if (!['saved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status harus 'saved' atau 'rejected'" });
    }

    const { error } = await supabase
      .from('batches')
      .update({ preprocessed_status: status })
      .eq('id', batchId);

    if (error) throw error;

    res.json({
      success: true,
      message: `Batch status successfully updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;