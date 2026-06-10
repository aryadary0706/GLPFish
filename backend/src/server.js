import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import authRoutes       from './routes/auth.js'
import userRoutes       from './routes/user.js'
import uploadRoutes     from './routes/upload.js'
import predictRoutes    from './routes/predict.js'
import inspectionRoutes from './routes/inspections.js'
import adminRoutes from './routes/admin.js'
import batchesRoutes     from './routes/batch.js'
import batchStatusRoutes from './routes/batchStatus.js'
import summaryRoutes     from './routes/summary.js'
import batchResultRoutes from './routes/batchResult.js'

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

app.use('/api/auth',        authRoutes)
app.use('/api/users',       userRoutes)
app.use('/api/upload',      uploadRoutes)
app.use('/api/upload',      predictRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/batches', summaryRoutes)
app.use('/api/batches', batchStatusRoutes)
app.use('/api/batches', batchResultRoutes)
app.use('/api/batches', batchesRoutes)


app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' })
})

app.use((_, res) => res.status(404).json({ error: 'Route tidak ditemukan' }))

const PORT = process.env.PORT ?? 4000
app.listen(PORT, () => console.log(`✅ Backend running → http://localhost:${PORT}`))