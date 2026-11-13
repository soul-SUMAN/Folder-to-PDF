import { upload, limitRequestSize } from '../middleware/upload.js';

router.post('/generate', generateLimiter, limitRequestSize, upload.array('files'), createPdf);