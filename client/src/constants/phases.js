export const PHASES = Object.freeze({
  IDLE: 'idle',
  UPLOADING: 'uploading',
  GENERATING: 'generating',
  DOWNLOADING: 'downloading',
  SUCCESS: 'success',
  ERROR: 'error',
});

export const BUSY_PHASES = [PHASES.UPLOADING, PHASES.GENERATING, PHASES.DOWNLOADING];

export const STEPS = [
  { key: PHASES.UPLOADING, label: 'Uploading codebase' },
  { key: PHASES.GENERATING, label: 'Generating PDF' },
  { key: PHASES.DOWNLOADING, label: 'Preparing download' },
];
