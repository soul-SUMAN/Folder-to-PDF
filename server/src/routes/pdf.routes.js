import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { limitRequestSize, upload } from '../middleware/upload.js';
import { createPdf, downloadPdf } from '../controllers/pdf.controller.js';

const router = Router();

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many requests, please try again later' },
});

const validateToken = (req, res, next) =>
  /^[a-f0-9]{64}$/.test(req.params.token)
    ? next()
    : res.status(404).json({ message: 'Link expired or already used' });

router.post('/generate', generateLimiter, limitRequestSize, upload.array('files'), createPdf);
router.get('/download/:token', validateToken, downloadPdf);

export default router;