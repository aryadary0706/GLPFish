import { fetchDistribusiSummary } from "../services/BatchService";

export const getDistribusiSummary = async (req, res) => {
  try {
    const { jenis, search } = req.query;

    // Memanggil fungsi dari service layer
    const result = await batchesService.fetchDistribusiSummary(jenis, search);

    // Mengirim respon sukses
    return res.status(200).json(result);
  } catch (error) {
    // Mengurus error handling HTTP
    return res.status(500).json({ error: error.message });
  }
};