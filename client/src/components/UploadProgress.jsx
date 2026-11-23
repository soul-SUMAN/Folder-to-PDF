import Stepper from './Stepper';
import { formatBytes } from '../utils/format';
import { PHASES } from '../constants/phases';

export default function UploadProgress({ phase, progress }) {
  const isUploading = phase === PHASES.UPLOADING;
  const phaseMessage = {
    [PHASES.PROCESSING]: 'Processing uploaded files…',
    [PHASES.GENERATING]: 'Generating your PDF…',
    [PHASES.DOWNLOADING]: 'PDF generated. Preparing your download…',
  }[phase];

  if (isUploading) {
    return (
      <div className="upload-banner" role="status" aria-live="polite">
        <div className="upload-banner__heading">
          <strong>Uploading your files…</strong>
          <strong>{progress.percent}%</strong>
        </div>
        <div
          className="bar"
          role="progressbar"
          aria-label="Codebase upload progress"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="bar__fill" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="panel__meta">
          {progress.total
            ? `${formatBytes(progress.loaded)} uploaded · ${formatBytes(progress.remaining)} left of ${formatBytes(progress.total)}`
            : 'Starting upload…'}
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <Stepper phase={phase} />

      {phase !== PHASES.DOWNLOADING ? (
        <>
          <div
            className="bar"
            role="progressbar"
            aria-label={`${phaseMessage} progress`}
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="bar__fill" style={{ width: `${progress.percent}%` }} />
          </div>

          <p className="panel__meta">
            {progress.total ? (
              <>
                <strong>{progress.percent}%</strong>
                {progress.message && <> · {progress.message}</>}
                <br />
                <span>{progress.loaded} of {progress.total} files</span>
              </>
            ) : (
              phaseMessage
            )}
          </p>
        </>
      ) : (
        <>
          <p className="panel__meta">{phaseMessage}</p>
          <div className="bar bar--indeterminate" role="progressbar" aria-label={phaseMessage}>
            <div className="bar__fill" />
          </div>
        </>
      )}
    </div>
  );
}
