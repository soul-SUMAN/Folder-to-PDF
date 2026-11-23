export const PHASES = Object.freeze({
  IDLE: 'idle',
  SCANNING: 'scanning',
  UPLOADING: 'uploading',
  READY: 'ready',
  PROCESSING: 'processing',
  GENERATING: 'generating',
  DOWNLOADING: 'downloading',
  SUCCESS: 'success',
  ERROR: 'error',
});

export const GENERATION_PHASES = [
  PHASES.PROCESSING,
  PHASES.GENERATING,
  PHASES.DOWNLOADING,
];

export const BUSY_PHASES = [PHASES.SCANNING, PHASES.UPLOADING, ...GENERATION_PHASES];

export const LOADING_SCREENS = Object.freeze({
  [PHASES.SCANNING]: {
    title: 'Reading your folder…',
    subtitle: 'Skipping dependencies, build output and secret files.',
  },
  [PHASES.UPLOADING]: {
    title: 'Uploading your codebase…',
    subtitle: 'Sending your source files to the server.',
  },
});

export const STEPS = [
  { key: PHASES.PROCESSING, label: 'Processing files' },
  { key: PHASES.GENERATING, label: 'Generating PDF' },
  { key: PHASES.DOWNLOADING, label: 'Preparing download' },
];
