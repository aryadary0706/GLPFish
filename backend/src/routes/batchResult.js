import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ==========================================
// 5. GET /api/batches/:batchId/hasil
// ==========================================
router.get('/:batchId/hasil', requireAuth, async (req, res) => {
  try {
    const { batchId } = req.params;

    const { data: batch, error } = await supabase
      .from('batches')
      .select(`
        *,
        fishes (
          id,
          fish_index,
          images ( storage_path ),
          prediction_results ( 
            grade, 
            confidence_score, 
            predicted_at 
          )
        )
      `)
      .eq('id', batchId)
      .single();

    if (error || !batch) {
      return res.status(404).json({ error: "Batch tidak ditemukan" });
    }

    let gradeA = 0, gradeB = 0, gradeC = 0;
    let totalConfidence = 0;
    let totalIkanProses = 0;
    let fishList = [];
    
    let timestamps = [];

    if (batch.fishes && batch.fishes.length > 0) {
      batch.fishes.sort((a, b) => (a.fish_index || 0) - (b.fish_index || 0));

      batch.fishes.forEach(fish => {
        if (fish.prediction_results && fish.prediction_results.length > 0) {
          const pred = fish.prediction_results[0];
          totalIkanProses++;
          
          const grade = pred.grade?.toUpperCase() || 'C';
          if (grade === 'A') gradeA++;
          else if (grade === 'B') gradeB++;
          else gradeC++;

          const confidence = pred.confidence_score ? Math.round(pred.confidence_score * 100) : 0;
          totalConfidence += confidence;

          if (pred.predicted_at) {
            timestamps.push(new Date(pred.predicted_at));
          }

          let imageUrl = null;
          if (fish.images?.storage_path) {
            const { data: publicUrlData } = supabase.storage
              .from('fish-images') 
              .getPublicUrl(fish.images.storage_path);
            imageUrl = publicUrlData?.publicUrl || null;
          }

          fishList.push({
            id: fish.id,
            name: `fish #${fish.fish_index || totalIkanProses}`,
            grade: grade,
            confidence: confidence,
            imageUrl: imageUrl
          });
        }
      });
    }

    const avgConfidence = totalIkanProses > 0 ? Math.round(totalConfidence / totalIkanProses) : 0;

    let durationStr = "00:00";
    if (timestamps.length > 1) {
      const minTime = new Date(Math.min(...timestamps));
      const maxTime = new Date(Math.max(...timestamps));
      const diffMs = maxTime - minTime;
      
      const totalSeconds = Math.floor(diffMs / 1000);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      durationStr = `${minutes}:${seconds}`;
    }

    res.json({
      grading: {
        batchId: batch.id,
        jenis: batch.fish_category,
        totalIkan: totalIkanProses,
        avgConfidence: avgConfidence,
        duration: durationStr,
        gradeA: gradeA,
        gradeB: gradeB,
        gradeC: gradeC,
        totalBerat: batch.berat_total || 0,
        fish: fishList
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;