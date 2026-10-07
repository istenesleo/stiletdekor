import { useState } from 'react';
import { Button, Stepper } from '@stiletdekor/ui';

export const QuoteWizard = () => {
  const steps = ['Típus', 'Részletek', 'Helyszín és fotók', 'Kapcsolat'];
  const [step, setStep] = useState(1);
  const [reached, setReached] = useState(1);
  const goTo = (index: number) => {
    setStep(index);
    setReached((r) => Math.max(r, index));
  };
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <Stepper steps={steps} current={step} reached={reached} onStepClick={goTo} />
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button variant="secondary" size="sm" disabled={step === 0} onClick={() => goTo(step - 1)}>
          Vissza
        </Button>
        <Button size="sm" disabled={step === steps.length - 1} onClick={() => goTo(step + 1)}>
          Tovább
        </Button>
      </div>
    </div>
  );
};

export const FirstStep = () => <Stepper steps={['Típus', 'Részletek', 'Helyszín és fotók', 'Kapcsolat']} current={0} />;

export const OnAPhone = () => (
  <div style={{ maxWidth: 360 }}>
    <Stepper steps={['Típus', 'Részletek', 'Helyszín és fotók', 'Kapcsolat']} current={2} onStepClick={() => {}} />
  </div>
);
