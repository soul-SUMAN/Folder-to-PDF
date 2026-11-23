import express from 'express';
import multer from 'multer';
import { MAX_TOTAL_BYTES } from '../utils/filters.js';

export const MAX_FILE_COUNT = 2000;
export const MAX_REQUEST_BYTES = 12 * 1024 * 1024;
const MAX_UPLOAD_FILE_BYTES = 1 * 1024 * 1024;
const MAX_UNCOMPRESSED_REQUEST_BYTES = 16 * 1024 * 1024;
const MAX_PATHS_BYTES = 5 * 1024 * 1024;

export const limitRequestSize = (req, res, next) => {
  const length = Number(req.headers['content-length'] ?? 0);

  if (length > MAX_REQUEST_BYTES) {
    return res.status(413).json({ message: 'Upload too large. Pick a smaller folder.' });
  }

  next();
};

const parseRawUploadBody = express.raw({
  type: 'application/octet-stream',
  limit: MAX_UNCOMPRESSED_REQUEST_BYTES,
  inflate: true,
});

export const compressedUploadBody = (req, res, next) => {
  parseRawUploadBody(req, res, (error) => {
    if (error) {
      if (Buffer.isBuffer(req.body)) req.body.fill(0);
      if (Buffer.isBuffer(error.body)) error.body.fill(0);
      return next(error);
    }

    next();
  });
};

export const parseCompressedUpload = (req, res, next) => {
  const body = req.body;
  const files = [];

  const reject = (status, message) => {
    files.forEach(({ buffer }) => buffer.fill(0));
    if (Buffer.isBuffer(body)) body.fill(0);
    return res.status(status).json({ message });
  };

  if (!Buffer.isBuffer(body)) {
    return reject(400, 'Invalid compressed upload');
  }

  const headerEnd = body.indexOf(0x0a);
  if (headerEnd < 0 || headerEnd > MAX_PATHS_BYTES) {
    return reject(413, 'File paths exceed the upload limit.');
  }

  let manifest;
  try {
    manifest = JSON.parse(body.subarray(0, headerEnd).toString('utf-8'));
  } catch {
    return reject(400, 'Invalid upload manifest');
  }

  if (!Array.isArray(manifest?.files)) {
    return reject(400, 'Invalid upload manifest');
  }

  if (manifest.files.length > MAX_FILE_COUNT) {
    return reject(413, 'Too many files. The limit is 2,000 files per request.');
  }

  let offset = headerEnd + 1;
  let totalBytes = 0;

  for (const entry of manifest.files) {
    if (
      typeof entry.path !== 'string' ||
      !Number.isSafeInteger(entry.size) ||
      entry.size < 0
    ) {
      return reject(400, 'Invalid file metadata');
    }
    if (entry.size > MAX_UPLOAD_FILE_BYTES) {
      return reject(413, 'Upload rejected: per-file size limit exceeded');
    }

    totalBytes += entry.size;
    if (totalBytes > MAX_TOTAL_BYTES) {
      return reject(413, 'Accepted files exceed the 10 MiB upload limit.');
    }

    const end = offset + entry.size;
    if (end > body.length) {
      return reject(400, 'Upload file data is incomplete');
    }

    files.push({ path: entry.path, buffer: Buffer.from(body.subarray(offset, end)) });
    offset = end;
  }

  if (offset !== body.length) {
    return reject(400, 'Unexpected data after upload files');
  }

  req.files = files;
  req.body = { paths: JSON.stringify(files.map(({ path }) => path)) };
  body.fill(0);
  next();
};

export const parseUploadRequest = (req, res, next) => {
  if (req.is('application/octet-stream')) return parseCompressedUpload(req, res, next);
  return upload.array('files')(req, res, next);
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024,   // max size per file
    fieldSize: 5 * 1024 * 1024,  // max size of the "paths" text field (default is 1 MB)
    files: MAX_FILE_COUNT,
  },
});