import { useCallback, useState } from 'react';
import { uploadFiles, generatePdf, downloadPdf } from '../api/pdfApi';
import { filterAcceptedFiles } from '../utils/filters';
import { validateSelection } from '../utils/validation';
import { nextPaint, wait } from '../utils/timing';
import { PHASES } from '../constants/phases';

const INITIAL_PROGRESS = { loaded: 0, total: 0, percent: 0, remaining: 0, message: '' };
const MIN_LOADING_MS = 1200;

const ERROR_MESSAGES = {
  413: 'Upload limit exceeded. The accepted source files must stay within the upload limits.',
  422: 'No readable source files found.',
  404: 'The uploaded files expired. Upload the folder again.',
  429: 'Too many requests. Please try again in a few minutes.',
  503: 'Server is busy. Please try again shortly.',
};

const getSelectionProblem = (selectedFiles) =>
  validateSelection(selectedFiles) ||
  (selectedFiles.length ? '' : 'No readable source files found.');

export const usePdfGenerator = () => {
  const [files, setFiles] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [uploadId, setUploadId] = useState('');
  const [error, setError] = useState('');

  const uploadSelection = useCallback(async (selectedFiles) => {
    const problem = getSelectionProblem(selectedFiles);
    if (problem) {
      setPhase(PHASES.ERROR);
      setError(problem);
      return;
    }

    const startedAt = Date.now();
    setPhase(PHASES.UPLOADING);
    setProgress(INITIAL_PROGRESS);
    setUploadId('');
    setError('');

    let staged;
    let uploadError;
    try {
      staged = await uploadFiles(selectedFiles);
    } catch (err) {
      uploadError = err;
    }

    await wait(Math.max(MIN_LOADING_MS - (Date.now() - startedAt), 0));

    if (uploadError) {
      setError(ERROR_MESSAGES[uploadError.response?.status] ?? 'Failed to upload files.');
      setPhase(PHASES.ERROR);
    } else if (!staged?.uploadId) {
      setError('The server did not confirm the upload.');
      setPhase(PHASES.ERROR);
    } else {
      setUploadId(staged.uploadId);
      setPhase(PHASES.READY);
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

  const selectFolder = useCallback(async (fileList) => {
    const all = Array.from(fileList);

    setFiles([]);
    setProjectName('');
    setUploadId('');
    setPhase(PHASES.SCANNING);
    setProgress(INITIAL_PROGRESS);
    setError('');
    await nextPaint();

    const accepted = filterAcceptedFiles(all);
    const selectedProjectName = all[0]?.webkitRelativePath.split('/')[0] ?? '';
    const problem = getSelectionProblem(accepted);

    setFiles(accepted);
    setProjectName(selectedProjectName);
    if (problem) {
      setPhase(PHASES.ERROR);
      setError(problem);
      return;
    }

    await uploadSelection(accepted);
  }, [uploadSelection]);

  const retryUpload = useCallback(() => uploadSelection(files), [files, uploadSelection]);

  return { files, projectName, phase, progress, error, selectFolder, generate, retryUpload };
};