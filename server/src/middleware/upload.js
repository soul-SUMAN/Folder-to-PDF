import multer from 'multer';

export const MAX_FILE_COUNT = 5000;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,   // max size per file
    fieldSize: 10 * 1024 * 1024, // max size of the "paths" text field (default is 1 MB)
    files: MAX_FILE_COUNT,
  },
});