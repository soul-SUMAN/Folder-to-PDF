import path from 'path';

export const MAX_FILE_BYTES = 500 * 1024;

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.vercel', '.turbo',
  '.cache', '.parcel-cache', '.svelte-kit', 'coverage', 'out', 'target', '.idea', '.vscode',
  '__pycache__', 'venv', '.venv', 'env', 'site-packages', '.tox', '.nox',
  '.mypy_cache', '.pytest_cache', '.ruff_cache', '.ipynb_checkpoints',
  '.eggs', '__pypackages__', 'htmlcov', 'conda-meta',
]);

const IGNORED_DIR_SUFFIXES = ['.egg-info', '.dist-info'];

const IGNORED_FILES = new Set([
  'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml',
]);

const SOURCE_EXTENSIONS = new Set([
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.vue', '.svelte',
  '.py', '.pyi', '.ipynb', '.java', '.kt', '.go', '.rs', '.rb', '.php',
  '.c', '.h', '.cpp', '.hpp', '.cs', '.swift', '.dart', '.lua', '.r', '.scala',
  '.sh', '.bat', '.ps1', '.sql', '.graphql', '.proto',
  '.html', '.css', '.scss', '.sass', '.less',
  '.json', '.yml', '.yaml', '.toml', '.ini', '.cfg', '.xml',
  '.md', '.txt', '.rst',
]);

const SOURCE_FILENAMES = new Set([
  'Dockerfile', 'Makefile', 'Procfile', '.gitignore', '.dockerignore',
  '.editorconfig', '.prettierrc', '.eslintrc', '.babelrc',
]);

const ENV_TEMPLATE = /^\.env\.(example|sample|template)$/;

const isSecretFile = (name) => /^\.env(\..+)?$/.test(name) && !ENV_TEMPLATE.test(name);

const isIgnoredDir = (dir) =>
  IGNORED_DIRS.has(dir) || IGNORED_DIR_SUFFIXES.some((suffix) => dir.endsWith(suffix));

const isSourceFile = (name) =>
  SOURCE_FILENAMES.has(name) ||
  ENV_TEMPLATE.test(name) ||
  SOURCE_EXTENSIONS.has(path.extname(name).toLowerCase());

export const shouldIncludePath = (relativePath) => {
  const segments = relativePath.split('/');
  const name = segments[segments.length - 1];

  if (segments.slice(0, -1).some(isIgnoredDir)) return false;
  if (IGNORED_FILES.has(name) || isSecretFile(name)) return false;

  return isSourceFile(name);
};