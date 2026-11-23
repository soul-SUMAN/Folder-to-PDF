export default function LoadingScreen({ title, subtitle }) {
  return (
    <div className="overlay" role="status" aria-live="polite">
      <div className="overlay__card">
        <div className="spinner" aria-hidden="true" />
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="bar bar--indeterminate">
          <div className="bar__fill" />
        </div>
      </div>
    </div>
  );
}
