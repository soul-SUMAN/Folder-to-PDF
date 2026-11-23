import { useCallback, useState } from 'react';
import { uploadFiles, generatePdf, downloadPdf } from '../api/pdfApi';
import { filterAcceptedFiles } from '../utils/filters';
import { validateSelection } from '../utils/validation';
import { PHASES } from '../constants/phases';

const INITIAL_PROGRESS = { loaded: 0, total: 0, percent: 0, remaining: 0, message: '' };

const ERROR_MESSAGES = {
  413: 'Upload limit exceeded. The accepted source files must stay within the upload limits.',
  422: 'No readable source files found.',
  404: 'The uploaded files expired. Upload the folder again.',
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
  const [uploadId, setUploadId] = useState('');
  const [error, setError] = useState('');

  const uploadSelection = useCallback(async (selectedFiles) => {
    const problem = validateSelection(selectedFiles) ||
      (selectedFiles.length ? '' : 'No readable source files found.');
    if (problem) {
      setPhase(PHASES.ERROR);
      setError(problem);
      return;
    }

    setPhase(PHASES.UPLOADING);
    setProgress(INITIAL_PROGRESS);
    setUploadId('');
    setError('');

    try {
      const staged = await uploadFiles(
        selectedFiles,
        (event) => {
          setProgress(toProgress(event));
        }
      );

      if (!staged.uploadId) throw new Error('The server did not confirm the upload.');
      setUploadId(staged.uploadId);
      setPhase(PHASES.READY);
    } catch (err) {
      setError(ERROR_MESSAGES[err.response?.status] ?? 'Failed to upload files.');
      setPhase(PHASES.ERROR);
    }
  }, []);

  const generate = useCallback(async () => {
    if (!uploadId) {
      setError('The uploaded files are no longer available. Upload the folder again.');
      setPhase(PHASES.ERROR);
      return;
    }

    setPhase(PHASES.PROCESSING);
    setProgress(INITIAL_PROGRESS);

    try {
      const { token } = await generatePdf(uploadId, (event) => {
        setPhase(event.phase);
        setProgress({
          loaded: event.completed ?? 0,
          total: event.total ?? 0,
          percent: event.percent ?? 0,
          remaining: Math.max((event.total ?? 0) - (event.completed ?? 0), 0),
          message: event.message ?? '',
        });
      });

      setUploadId('');
      setPhase(PHASES.DOWNLOADING);
      await downloadPdf(token, `${projectName}-master.pdf`);
      setPhase(PHASES.SUCCESS);
    } catch (err) {
      setUploadId('');
      setError(ERROR_MESSAGES[err.response?.status] ?? 'Failed to generate PDF.');
      setPhase(PHASES.ERROR);
    }
  }, [projectName, uploadId]);

  const selectFolder = useCallback((fileList) => {
    const all = Array.from(fileList);
    const accepted = filterAcceptedFiles(all);
    const selectedProjectName = all[0]?.webkitRelativePath.split('/')[0] ?? '';
    const problem = validateSelection(accepted) ||
      (accepted.length ? '' : 'No readable source files found.');

    setFiles(accepted);
    setProjectName(selectedProjectName);
    setProgress(INITIAL_PROGRESS);
    if (problem) {
      setPhase(PHASES.ERROR);
      setError(problem);
      return;
    }

    void uploadSelection(accepted);
  }, [uploadSelection]);

  const retryUpload = useCallback(() => uploadSelection(files), [files, uploadSelection]);

  return { files, projectName, phase, progress, error, selectFolder, generate, retryUpload };
};