import { STEPS } from '../constants/phases';

export default function Stepper({ phase }) {
  const activeIndex = STEPS.findIndex((step) => step.key === phase);

  return (
    <ol className="stepper">
      {STEPS.map((step, index) => {
        const state = index < activeIndex ? 'is-done' : index === activeIndex ? 'is-active' : '';
        return (
          <li key={step.key} className={`stepper__item ${state}`}>
            <span className="stepper__dot">{index < activeIndex ? '✓' : index + 1}</span>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
