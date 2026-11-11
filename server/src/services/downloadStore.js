import crypto from 'crypto';

const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 200;
const store = new Map();

const wipe = (entry) => {
  clearTimeout(entry.timer);
  entry.buffer.fill(0);
};

export const saveDownload = (buffer, filename) => {
  if (store.size >= MAX_ENTRIES) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const timer = setTimeout(() => {
    const entry = store.get(token);
    if (entry) {
      wipe(entry);
      store.delete(token);
    }
  }, TTL_MS);

  store.set(token, { buffer, filename, timer });
  return { token, expiresInMs: TTL_MS };
};

// One-time use: removes the entry immediately; caller must wipe after sending
export const consumeDownload = (token) => {
  const entry = store.get(token);
  if (!entry) return null;
  store.delete(token);
  clearTimeout(entry.timer);
  return entry;
};