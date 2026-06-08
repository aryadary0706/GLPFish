import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

// ── Import Routes ─────────────────────────────────────────
import authRoutes       from './routes/auth.js'
import userRoutes       from './routes/user.js'
import uploadRoutes     from './routes/upload.js'
import predictRoutes    from './routes/predict.js'
import inspectionRoutes from './routes/inspections.js'

// Route Batch (Jika Anda memisahkannya menjadi beberapa file)
import batchesRoutes     from './routes/batch.js'
import batchStatusRoutes from './routes/batchStatus.js'
import summaryRoutes     from './routes/summary.js'
import batchResultRoutes from './routes/batchResult.js'

dotenv.config({ path: '.env.local' })

const app = express()

// ── Security & Logging ────────────────────────────────────
app.use(helmet())
app.use(morgan('dev'))

// ── Rate limiting ─────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Terlalu banyak percobaan, coba lagi nanti' },
}))

// ── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

// ── Body Parser ───────────────────────────────────────────
// express.json() aman digunakan secara global karena secara otomatis 
// mengabaikan request yang bertipe multipart/form-data (Multer)
app.use(express.json())

// ── Routes Registration ───────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/users',       userRoutes)

// Route Upload & Predict (Modular)
app.use('/api/upload',      uploadRoutes)
app.use('/api/upload',      predictRoutes)

// app.use('/api/inspections', inspectionRoutes)

/**
 * ⚠️ ATURAN PENTING UNTUK ROUTE YANG DIPISAH:
 * Urutkan dari route dengan path statis/spesifik terlebih dahulu, 
 * baru kemudian route dinamis yang menggunakan parameter seperti (:id atau :batchId).
 */
app.use('/api/batches', summaryRoutes)     // Misal untuk GET /api/batches/distribusi
app.use('/api/batches', batchStatusRoutes)  // Misal untuk PATCH /api/batches/:batchId/status
app.use('/api/batches', batchResultRoutes)  // Misal untuk GET /api/batches/:batchId/hasil
app.use('/api/batches', batchesRoutes)      // Menangani GET / dan POST / dasar

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' })
})

// ── 404 handler ───────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route tidak ditemukan' }))

const PORT = process.env.PORT ?? 4000
app.listen(PORT, () => console.log(`✅ Backend running → http://localhost:${PORT}`))