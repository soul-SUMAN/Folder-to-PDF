const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.vercel',
  'coverage', '.idea', '.vscode', '__pycache__', '.cache', '.turbo',
  'venv', '.venv', 'env', 'target', 'out', '.parcel-cache', '.svelte-kit',
]);

const IGNORED_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store']);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', '.pdf',
  '.zip', '.rar', '.7z', '.mp3', '.mp4', '.mov', '.woff', '.woff2',
  '.ttf', '.eot', '.exe', '.dll', '.bin', '.lock',
]);

const isSecretFile = (name) => /^\.env(\..+)?$/.test(name) && !/\.(example|sample|template)$/.test(name);

const MAX_FILE_BYTES = 500 * 1024;
export const MAX_FILE_COUNT = 2000;

export const isAcceptedFile = (file) => {
  const relativePath = file.webkitRelativePath;
  const segments = relativePath.split('/');
  const fileName = segments[segments.length - 1];
  const ext = fileName.includes('.') ? `.${fileName.split('.').pop().toLowerCase()}` : '';

  if (segments.slice(0, -1).some((dir) => IGNORED_DIRS.has(dir))) return false;
  if (IGNORED_FILES.has(fileName)) return false;
  if (isSecretFile(fileName)) return false;
  if (BINARY_EXTENSIONS.has(ext)) return false;
  return file.size <= MAX_FILE_BYTES;
};