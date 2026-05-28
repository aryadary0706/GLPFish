// src/lib/fishModel.js
import FormData from 'form-data'
import fetch from 'node-fetch'

const MODEL_URL = process.env.FISH_MODEL_API_URL

/**
 * Cek apakah FastAPI model server hidup dan model sudah di-load
 * @returns {Promise<boolean>}
 */
export async function checkModelHealth() {
  try {
    const res  = await fetch(`${MODEL_URL}/health`, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return data.model_ready === true
  } catch {
    return false
  }
}

/**
 * Kirim foto mata + insang ke FastAPI, terima hasil prediksi grade ikan
 *
 * @param {Buffer} eyeBuffer     - Buffer foto mata
 * @param {string} eyeMimetype   - MIME type foto mata (image/jpeg, dll)
 * @param {Buffer} gillBuffer    - Buffer foto insang
 * @param {string} gillMimetype  - MIME type foto insang
 *
 * @returns {Promise<{
 *   grade: string,
 *   label: string,
 *   warna: string,
 *   layak_ekspor: boolean,
 *   mata: { kelas: string, status: string, confidence: number, probabilitas: object },
 *   insang: { kelas: string, status: string, confidence: number, probabilitas: object },
 *   waktu_proses_ms: number,
 *   timestamp: string
 * }>}
 */
export async function predictFishQuality(eyeBuffer, eyeMimetype, gillBuffer, gillMimetype) {
  const form = new FormData()

  form.append('eye', eyeBuffer, {
    filename:    `eye${_ext(eyeMimetype)}`,
    contentType: eyeMimetype,
  })
  form.append('gill', gillBuffer, {
    filename:    `gill${_ext(gillMimetype)}`,
    contentType: gillMimetype,
  })

  let res
  try {
    res = await fetch(`${MODEL_URL}/predict`, {
      method:  'POST',
      body:    form,
      headers: form.getHeaders(),
      signal:  AbortSignal.timeout(30000), // timeout 30 detik
    })
  } catch (err) {
    // Network error / timeout
    throw new Error(err.detail || `Model server error (${res.status})`)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    // Teruskan pesan error dari FastAPI langsung ke client
    throw new Error(err.detail || `Model server error (${res.status})`)
  }

  return await res.json()
}

// Helper
function _ext(mimetype) {
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
  return map[mimetype] ?? '.jpg'
}