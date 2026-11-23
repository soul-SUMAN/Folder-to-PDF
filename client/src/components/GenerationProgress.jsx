import Stepper from './Stepper';
import { PHASES } from '../constants/phases';

const PHASE_MESSAGES = {
  [PHASES.PROCESSING]: 'Processing uploaded files…',
  [PHASES.GENERATING]: 'Generating your PDF…',
  [PHASES.DOWNLOADING]: 'PDF generated. Preparing your download…',
};

export default function GenerationProgress({ phase, progress }) {
  const message = PHASE_MESSAGES[phase];

  if (phase === PHASES.DOWNLOADING) {
    return (
      <div className="panel">
        <Stepper phase={phase} />
        <p className="panel__meta">{message}</p>
        <div className="bar bar--indeterminate" role="progressbar" aria-label={message}>
          <div className="bar__fill" />
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <Stepper phase={phase} />

      <div
        className="bar"
        role="progressbar"
        aria-label={message}
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
          message
        )}
      </p>
    </div>
  );
}
