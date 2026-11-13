import multer from 'multer';

export const MAX_FILE_COUNT = 2000;
export const MAX_REQUEST_BYTES = 12 * 1024 * 1024;

export const limitRequestSize = (req, res, next) => {
  const length = Number(req.headers['content-length'] ?? 0);

  if (length > MAX_REQUEST_BYTES) {
    return res.status(413).json({ message: 'Upload too large. Pick a smaller folder.' });
  }

  next();
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024,   // max size per file
    fieldSize: 5 * 1024 * 1024,  // max size of the "paths" text field (default is 1 MB)
    files: MAX_FILE_COUNT,
  },
});