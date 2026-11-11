import multer from 'multer';

export const errorHandler = (err, _req, res, _next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ message: 'Too many files. The limit is 5,000 files per request.' });
    }
    return res.status(413).json({ message: `Upload rejected: ${err.code}` });
  }

  res.status(err.status ?? 500).json({ message: err.message ?? 'Server error' });
};