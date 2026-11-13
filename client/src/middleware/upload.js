export const MAX_REQUEST_BYTES = 12 * 1024 * 1024;

// Rejects oversized uploads before Multer buffers them in RAM
export const limitRequestSize = (req, res, next) => {
  const length = Number(req.headers['content-length'] ?? 0);

  if (length > MAX_REQUEST_BYTES) {
    return res.status(413).json({ message: 'Upload too large. Pick a smaller folder.' });
  }
  next();
};