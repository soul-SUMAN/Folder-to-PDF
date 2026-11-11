import Stepper from './Stepper';
import { formatBytes } from '../utils/format';

export default function UploadProgress({ phase, progress }) {
  const isUploading = phase === 'uploading';
  const phaseMessage = {
    generating: 'Upload complete. Generating your PDF…',
    downloading: 'PDF generated. Preparing your download…',
  }[phase];

  return (
    <div className="panel">
      <Stepper phase={phase} />

      {isUploading ? (
        <>
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
            {progress.total ? (
              <>
                <strong>{progress.percent}%</strong> · {formatBytes(progress.loaded)} uploaded · {formatBytes(progress.remaining)} left
                <br />
                <span>{formatBytes(progress.total)} total</span>
              </>
            ) : (
              'Uploading codebase…'
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
