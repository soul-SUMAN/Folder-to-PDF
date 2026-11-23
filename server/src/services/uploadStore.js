import crypto from 'crypto';

const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 10;
const MAX_STAGED_BYTES = 64 * 1024 * 1024;
const store = new Map();
let stagedBytes = 0;

export const saveUpload = (files, totalBytes, skippedCount) => {
  if (store.size >= MAX_ENTRIES || stagedBytes + totalBytes > MAX_STAGED_BYTES) return null;

  let uploadId;
  do {
    uploadId = crypto.randomBytes(32).toString('hex');
  } while (store.has(uploadId));

  const timer = setTimeout(() => {
    const entry = store.get(uploadId);
    if (!entry) return;

    entry.files.forEach(({ buffer }) => buffer.fill(0));
    stagedBytes -= entry.totalBytes;
    store.delete(uploadId);
  }, TTL_MS);

  store.set(uploadId, { files, totalBytes, skippedCount, timer });
  stagedBytes += totalBytes;
  return { uploadId, expiresInMs: TTL_MS };
};

export const consumeUpload = (uploadId) => {
  const entry = store.get(uploadId);
  if (!entry) return null;

  clearTimeout(entry.timer);
  store.delete(uploadId);
  stagedBytes -= entry.totalBytes;
  return entry;
};
