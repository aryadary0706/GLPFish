import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Helper function untuk format tanggal ke "DD MMMM YYYY" dalam bahasa Indonesia
const formatIndonesianDate = (dateString) => {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// 1. POST /api/batches
router.post('/', requireAuth, async (req, res) => {
  try {
    const { jenis, tanggal, lokasi, estimasi_jumlah, berat_total, catatan } = req.body;
    
    const userId = req.user.id ; 

    const now = new Date();
    const yearMonth = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const randomCounter = Math.floor(100 + Math.random() * 900);
    const generatedId = `B-${yearMonth}-${randomCounter}`;

    const { data, error } = await supabase
      .from('batches')
      .insert([
        {
          id: generatedId,
          user_id: userId,
          fish_category: jenis,
          created_at: tanggal || new Date().toISOString(),
          status: 'pending',
          preprocessed_status: 'incomplete',
          lokasi: lokasi,
          fish_count: estimasi_jumlah,
          berat_total: berat_total,
          catatan: catatan
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
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
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET /api/batches
router.get('/', requireAuth,async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('batches')
      .select(`
        *,
        fishes (
          id,
          prediction_results ( grade )
        )
      `);

    if (status) {
      query = query.eq('preprocessed_status', status);
    }

    const { data: batches, error } = await query;
    if (error) throw error;

    // Mapping & Agregasi data sesuai format response yang diminta
    const formattedBatches = batches.map(batch => {
      let gradeA = 0, gradeB = 0, gradeC = 0;
      let totalProses = 0;

      if (batch.fishes) {
        batch.fishes.forEach(fish => {
          if (fish.prediction_results && fish.prediction_results.length > 0) {
            totalProses++;
            const grade = fish.prediction_results[0].grade?.toUpperCase();
            if (grade === 'A') gradeA++;
            if (grade === 'B') gradeB++;
            if (grade === 'C') gradeC++;
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
        berat: batch.berat_total || 0,
        estimasi_jumlah: batch.estimasi_jumlah || batch.fish_count || 0
      };
    });

    res.json({ batches: formattedBatches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;