import { MAX_FILE_COUNT, MAX_TOTAL_BYTES } from './filters';
import { formatBytes } from './format';

const HINT = 'Pick a smaller folder (for example just src/).';

// Returns an error message, or an empty string when the selection is fine
export const validateSelection = (files) => {
  if (files.length > MAX_FILE_COUNT) {
    return `This folder has ${files.length} source files, but the limit is ${MAX_FILE_COUNT}. ${HINT}`;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return `The source code is ${formatBytes(totalBytes)}, but the limit is ${formatBytes(MAX_TOTAL_BYTES)}. ${HINT}`;
  }

  return '';
};