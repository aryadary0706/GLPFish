import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import authRoutes       from './routes/auth.js'
import userRoutes       from './routes/user.js'
import uploadRoutes     from './routes/upload.js'
import inspectionRoutes from './routes/inspections.js'

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
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? [process.env.ALLOWED_ORIGIN]
  : [/^http:\/\/localhost:(5173|5174|5175|5176|5177|5178|5179)$/]

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))

// ── Body Parser ───────────────────────────────────────────
// Skip express.json() untuk route upload — multer yang handle body parsing-nya
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/upload')) return next()
  express.json()(req, res, next)
})

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/user',        userRoutes)
app.use('/api/upload',      uploadRoutes)
app.use('/api/inspections', inspectionRoutes)

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