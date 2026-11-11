import FolderPicker from './components/FolderPicker';
import UploadProgress from './components/UploadProgress';
import { usePdfGenerator } from './hooks/usePdfGenerator';
import { PHASES, BUSY_PHASES } from './constants/phases';
import { MAX_FILE_COUNT } from './utils/filters';
import { formatBytes } from './utils/format';
import './App.css';

export default function App() {
  const { files, projectName, phase, progress, error, selectFolder, generate } = usePdfGenerator();

  const isBusy = BUSY_PHASES.includes(phase);
  const isOverLimit = files.length > MAX_FILE_COUNT;
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

          {isBusy ? (
            <UploadProgress phase={phase} progress={progress} />
          ) : (
            <button className="btn" onClick={generate} disabled={isBusy || isOverLimit}>
              Generate PDF
            </button>
          )}
        </section>
      )}

      {phase === PHASES.SUCCESS && <p className="ok">PDF downloaded ✅</p>}
      {phase === PHASES.ERROR && <p className="err">{error}</p>}

      <footer className="privacy">
        🔒 Files are processed in server memory only, never written to disk. The download link works
        once and expires after 5 minutes.
      </footer>

    </main>
  );
}