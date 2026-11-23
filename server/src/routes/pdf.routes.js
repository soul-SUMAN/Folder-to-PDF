import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { limitRequestSize, upload } from '../middleware/upload.js';
import { uploadFiles, generatePdfFromUpload, downloadPdf } from '../controllers/pdf.controller.js';

const router = Router();

const createLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many requests, please try again later' },
});

const uploadLimiter = createLimiter();
const generateLimiter = createLimiter();

const validateToken = (req, res, next) =>
  /^[a-f0-9]{64}$/.test(req.params.token)
    ? next()
    : res.status(404).json({ message: 'Link expired or already used' });

router.post('/upload', uploadLimiter, limitRequestSize, upload.array('files'), uploadFiles);
router.post('/generate', generateLimiter, generatePdfFromUpload);
router.get('/download/:token', validateToken, downloadPdf);

export default router;