Stepper from @stiletdekor/ui. Use via `window.StiletUI.Stepper` (bundle loaded from the root `_ds_bundle.js`). Wrap the tree in `<ThemeRoot>` (full provider chain in README.md — components read theme/i18n from that context).

Progress through a multi-step form such as the quote wizard, with the steps as a bar.
Shows "2. lépés a 4-ből". Steps already reached can be clicked to go back. When it is narrow (phones), the
bar shows only the step numbers and the current step's name moves next to the count.
@category quote

## Props

```ts
interface StepperProps {
  /** Step names, e.g. ["Típus", "Részletek", "Helyszín és fotók", "Kapcsolat"]. */
  steps: readonly string[];
  /** Index of the current step, from 0. */
  current: number;
  /** Furthest step reached; earlier steps can be revisited. Defaults to `current`. */
  reached?: number;
  /** Makes reached steps clickable (going back to change an answer). */
  onStepClick?: (index: number) => void;
  /** Accessible name of the step list, "Lépések" by default. */
  label?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}
```

## Examples

### QuoteWizard

```jsx
() => {
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
}
```

### FirstStep

```jsx
() => <Stepper steps={['Típus', 'Részletek', 'Helyszín és fotók', 'Kapcsolat']} current={0} />
```

### OnAPhone

```jsx
() => (
  <div style={{ maxWidth: 360 }}>
    <Stepper steps={['Típus', 'Részletek', 'Helyszín és fotók', 'Kapcsolat']} current={2} onStepClick={() => {}} />
  </div>
)
```
