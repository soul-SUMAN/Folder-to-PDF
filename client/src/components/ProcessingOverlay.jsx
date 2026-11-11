import Stepper from './Stepper';
import { PHASES } from '../constants/phases';

export default function ProcessingOverlay({ phase }) {
  const isDownloading = phase === PHASES.DOWNLOADING;

  return (
    <div className="overlay" role="status" aria-live="polite">
      <div className="overlay__card">
        <Stepper phase={phase} />
        <h2>{isDownloading ? 'Almost done…' : 'Creating your PDF…'}</h2>
        <p>
          {isDownloading
            ? 'Your download is starting.'
            : 'Building the folder tree and formatting every file. This can take a few seconds.'}
        </p>
        <div className="bar bar--indeterminate">
          <div className="bar__fill" />
        </div>
      </div>
    </div>
  );
}
