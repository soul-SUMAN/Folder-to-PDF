import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import pdfRoutes from './routes/pdf.routes.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const allowedOrigins = new Set([
  process.env.CLIENT_URL,
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

    callback(new Error('Not allowed by CORS'));
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