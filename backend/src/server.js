import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import authRoutes       from './routes/auth.js'
import userRoutes       from './routes/user.js'
import adminRoutes from './routes/admin.js'
import batchesRoutes from './routes/batches.js'
import inspectionRoutes from './routes/Inspection.js'

dotenv.config({ path: '.env.local' })

const app = express()

app.use(helmet())
app.use(morgan('dev'))

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Terlalu banyak percobaan, coba lagi nanti' },
}))


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/upload', inspectionRoutes)
app.use('/api/inspections', inspectionRoutes)
app.use('/api/batches', batchesRoutes)
app.use('/api/admin', adminRoutes)


app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' })
})

app.use((_, res) => res.status(404).json({ error: 'Route tidak ditemukan' }))

const PORT = process.env.PORT ?? 4000
app.listen(PORT, () => console.log(`✅ Backend running → http://localhost:${PORT}`))