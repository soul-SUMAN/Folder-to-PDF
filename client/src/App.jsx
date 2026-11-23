import FolderPicker from './components/FolderPicker';
import LoadingScreen from './components/LoadingScreen';
import GenerationProgress from './components/GenerationProgress';
import { usePdfGenerator } from './hooks/usePdfGenerator';
import {
  PHASES,
  BUSY_PHASES,
  GENERATION_PHASES,
  LOADING_SCREENS,
} from './constants/phases';
import { validateSelection } from './utils/validation';
import { formatBytes } from './utils/format';
import './App.css';

export default function App() {
  const {
    files,
    projectName,
    phase,
    progress,
    error,
    downloadToken,
    selectFolder,
    generate,
    download,
    retryUpload,
  } = usePdfGenerator();

  const isBusy = BUSY_PHASES.includes(phase);
  const isGenerating = GENERATION_PHASES.includes(phase);
  const loadingScreen = LOADING_SCREENS[phase];
  const isOverLimit = Boolean(validateSelection(files));
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <main className="container">
      <h1>📄 Folder → Master PDF</h1>
      <p className="subtitle">
        Turn a whole codebase into one PDF (folder tree first, then every file) for ChatGPT or Claude.
      </p>

      <FolderPicker onSelect={selectFolder} disabled={isBusy} />

      {files.length > 0 && (
        <section className="summary">
          <p>
            <strong>{projectName}</strong>: {files.length} files · {formatBytes(totalBytes)}
            <br />
            <small>node_modules, .env files, binaries and lock files are skipped</small>
          </p>

          {phase === PHASES.READY && (
            <section className="panel ready-panel">
              <p>Upload complete. Your files are ready to be processed.</p>
              <button className="btn" onClick={generate}>Generate PDF</button>
            </section>
          )}

          {isGenerating && <GenerationProgress phase={phase} progress={progress} />}

          {phase === PHASES.ERROR && files.length > 0 && (
            <button className="btn" onClick={retryUpload} disabled={isOverLimit}>
              Retry Upload
            </button>
          )}
        </section>
      )}

      {phase === PHASES.SUCCESS && !downloadToken && <p className="ok">PDF downloaded ✅</p>}
      {phase === PHASES.SUCCESS && downloadToken && (
        <section className="panel ready-panel">
          <p>Your PDF is ready.</p>
          <button className="btn" onClick={download}>Click to download PDF</button>
        </section>
      )}
      {phase === PHASES.ERROR && <p className="err">{error}</p>}

      <footer className="privacy">
        🔒 Files are processed in server memory only, never written to disk. The download link works
        once and expires after 5 minutes.
      </footer>

      {loadingScreen && <LoadingScreen {...loadingScreen} />}
    </main>
  );
}