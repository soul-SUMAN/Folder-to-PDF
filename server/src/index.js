import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import pdfRoutes from './routes/pdf.routes.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const configuredOrigins = (process.env.CLIENT_URL ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => new URL(origin).origin);
const allowedOrigins = new Set([
  ...configuredOrigins,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean));

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error(`Origin ${origin} is not allowed by CORS`);
    error.status = 403;
    callback(error);
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use('/api/pdf', pdfRoutes);
app.use(errorHandler);

connectDB()
  .then(() => app.listen(process.env.PORT, () => console.log(`API on :${process.env.PORT}`)))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });