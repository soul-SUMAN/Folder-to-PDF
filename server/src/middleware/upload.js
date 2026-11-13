import multer from 'multer';

export const MAX_FILE_COUNT = 2000;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024,   // max size per file
    fieldSize: 5 * 1024 * 1024,  // max size of the "paths" text field (default is 1 MB)
    files: MAX_FILE_COUNT,
  },
});