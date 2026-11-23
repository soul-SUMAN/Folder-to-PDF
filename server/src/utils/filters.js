import path from 'path';

export const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.vercel',
  'coverage', '.idea', '.vscode', '__pycache__', '.cache', '.turbo',
  'venv', '.venv', 'env', 'target', 'out', '.parcel-cache', '.svelte-kit',
]);

export const IGNORED_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store',
]);

export const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', '.pdf',
  '.zip', '.rar', '.7z', '.mp3', '.mp4', '.mov', '.woff', '.woff2',
  '.ttf', '.eot', '.exe', '.dll', '.bin', '.lock',
]);

const isSecretFile = (name) => /^\.env(\..+)?$/.test(name) && !/\.(example|sample|template)$/.test(name);

export const MAX_FILE_BYTES = 500 * 1024; // skip files over 500 KB
export const MAX_TOTAL_BYTES = 10 * 1024 * 1024;

export const shouldIncludePath = (relativePath) => {
  const segments = relativePath.split('/');
  const fileName = segments[segments.length - 1];

  if (segments.slice(0, -1).some((dir) => IGNORED_DIRS.has(dir))) return false;
  if (IGNORED_FILES.has(fileName)) return false;
  if (isSecretFile(fileName)) return false;
  if (BINARY_EXTENSIONS.has(path.extname(fileName).toLowerCase())) return false;

  return true;
};
