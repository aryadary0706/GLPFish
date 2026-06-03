import { supabase } from '../lib/supabase.js'
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Helper function untuk format tanggal ke "DD MMMM YYYY" dalam bahasa Indonesia
const formatIndonesianDate = (dateString) => {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// ==========================================
// GET /api/batches/distribusi
// ==========================================
router.get('/distribusi', requireAuth, async (req, res) => {
  try {
    const { jenis, search } = req.query;

    let query = supabase
      .from('batches')
      .select(`
        *,
        fishes (
          id,
          prediction_results ( grade )
        )
      `);

    // Filter berdasarkan query params jika ada
    if (jenis) {
      query = query.eq('fish_category', jenis);
    }
    if (search) {
      query = query.ilike('id', `%${search}%`);
    }

    const { data: batches, error } = await query;
    if (error) throw error;

    let totalBatch = batches.length;
    let totalIkanGlobal = 0;
    let globalGradeA = 0;
    let globalGradeC = 0;

    const formattedBatches = batches.map(batch => {
      let gradeA = 0, gradeB = 0, gradeC = 0;
      let totalIkanBatch = 0;

      if (batch.fishes) {
        batch.fishes.forEach(fish => {
          if (fish.prediction_results && fish.prediction_results.length > 0) {
            totalIkanBatch++;
            const grade = fish.prediction_results[0].grade?.toUpperCase();
            if (grade === 'A') gradeA++;
            if (grade === 'B') gradeB++;
            if (grade === 'C') gradeC++;
          }
        });
      }

      // Akumulasi untuk stats global
      totalIkanGlobal += totalIkanBatch;
      globalGradeA += gradeA;
      globalGradeC += gradeC;

      return {
        id: batch.id,
        date: formatIndonesianDate(batch.created_at), // Format: "24 Mei 2026"
        jenis: batch.fish_category,
        gradeA,
        gradeB,
        gradeC,
        total: totalIkanBatch,
        berat: parseFloat(batch.berat_total || 0),
        status: batch.status
      };
    });

    // Kalkulasi persentase global
    const gradeAPercent = totalIkanGlobal > 0 ? Math.round((globalGradeA / totalIkanGlobal) * 100) : 0;
    const rejectPercent = totalIkanGlobal > 0 ? Math.round((globalGradeC / totalIkanGlobal) * 100) : 0;

    res.json({
      stats: {
        totalBatch,
        totalIkan: totalIkanGlobal,
        gradeAPercent,
        rejectPercent // Grade C dianggap reject sesuai struktur mock
      },
      batches: formattedBatches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;