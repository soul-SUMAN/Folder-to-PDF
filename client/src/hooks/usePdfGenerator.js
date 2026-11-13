import { useCallback, useState } from 'react';
import { generatePdf, downloadPdf } from '../api/pdfApi';
import { filterAcceptedFiles } from '../utils/filters';
import { validateSelection } from '../utils/validation';
import { PHASES } from '../constants/phases';

const INITIAL_PROGRESS = { loaded: 0, total: 0, percent: 0, remaining: 0 };

const ERROR_MESSAGES = {
  413: 'Upload limit exceeded. Remove or exclude generated/dependency folders and try again.',
  422: 'No readable source files found.',
  429: 'Too many requests. Please try again in a few minutes.',
  503: 'Server is busy. Please try again shortly.',
};

const toProgress = ({ loaded, total }) => {
  const safeTotal = total ?? 0;
  const safeLoaded = Math.min(loaded, safeTotal);
  const remaining = Math.max(safeTotal - safeLoaded, 0);

  return {
    loaded: safeLoaded,
    total: safeTotal,
    remaining,
    percent: safeTotal ? Math.min(100, Math.round((safeLoaded * 100) / safeTotal)) : 0,
  };
};

export const usePdfGenerator = () => {
  const [files, setFiles] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [error, setError] = useState('');

  const selectFolder = useCallback((fileList) => {
    const all = Array.from(fileList);
    const accepted = filterAcceptedFiles(all);
    const problem = validateSelection(accepted);

    setFiles(accepted);
    setProjectName(all[0]?.webkitRelativePath.split('/')[0] ?? '');
    setProgress(INITIAL_PROGRESS);
    setPhase(problem ? PHASES.ERROR : PHASES.IDLE);
    setError(problem);
  }, []);

  const generate = useCallback(async () => {
    const problem = validateSelection(files);
    if (problem) {
      setPhase(PHASES.ERROR);
      setError(problem);
      return;
    }

    setPhase(PHASES.UPLOADING);
    setProgress(INITIAL_PROGRESS);
    setError('');

    try {
      const { token } = await generatePdf(files, (event) => {
        const next = toProgress(event);
        setProgress(next);
        if (next.percent >= 100) setPhase(PHASES.GENERATING);
      });

      setPhase(PHASES.DOWNLOADING);
      await downloadPdf(token, `${projectName}-master.pdf`);
      setPhase(PHASES.SUCCESS);
    } catch (err) {
      setError(ERROR_MESSAGES[err.response?.status] ?? 'Failed to generate PDF.');
      setPhase(PHASES.ERROR);
    }
  }, [files, projectName]);

  return { files, projectName, phase, progress, error, selectFolder, generate };
};