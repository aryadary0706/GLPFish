// src/lib/fishModel.js
import FormData from 'form-data'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

function getModelUrl() {
  const url = process.env.FISH_MODEL_API_URL
  if (!url) {
    throw new Error('FISH_MODEL_API_URL belum diset di .env.local')
  }
  return url.replace(/\/$/, '')
}

/**
 * Cek apakah FastAPI model server hidup dan model sudah di-load
 * @returns {Promise<boolean>}
 */
export async function checkModelHealth({ retries = 3, retryDelayMs = 5000, timeoutMs = 15000 } = {}) {
  let url
  try {
    url = getModelUrl()
  } catch (err) {
    console.error('[model-health]', err.message)
    return false
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(timeoutMs) })
      const data = await res.json()
      if (data.model_ready === true) return true
      console.warn(`[model-health] attempt ${attempt}: model_ready=${data.model_ready}`)
    } catch (err) {
      console.warn(`[model-health] attempt ${attempt} gagal: ${err.message}`)
    }
    if (attempt < retries) await new Promise((r) => setTimeout(r, retryDelayMs))
  }
  return false
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
  const url = getModelUrl()
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
    res = await fetch(`${url}/predict`, {
      method:  'POST',
      body:    form,
      headers: form.getHeaders(),
      signal:  AbortSignal.timeout(60000), // timeout 60 detik (HF Space CPU bisa lambat)
    })
  } catch (err) {
    // Network error / timeout
    throw new Error(`Model server error: ${err.message || err}`)
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.detail || `Model server error (HTTP ${res.status})`)
  }

  return await res.json()
}

// Helper
function _ext(mimetype) {
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
  return map[mimetype] ?? '.jpg'
}