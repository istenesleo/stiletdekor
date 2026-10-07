import { FIT_MODES, type FitMode } from '@/domain/preflight';
import { SegmentedChoice, type SegmentedChoiceProps } from '../SegmentedChoice/SegmentedChoice';

export interface FitPickerProps extends Omit<SegmentedChoiceProps, 'options' | 'value' | 'onChange' | 'legend'> {
  value: FitMode;
  onChange: (value: FitMode) => void;
  /** "Ha a kép aránya eltér" by default. */
  legend?: string;
}

/**
 * Fill (crop) or fit (frame) when the artwork's aspect ratio differs from the product's.
 * @category forms
 */
export function FitPicker({ value, onChange, legend = 'Ha a kép aránya eltér', ...rest }: FitPickerProps) {
  const options = (Object.keys(FIT_MODES) as FitMode[]).map((mode) => ({
    value: mode,
    label: FIT_MODES[mode].label,
    description: FIT_MODES[mode].description,
  }));
  return <SegmentedChoice legend={legend} options={options} value={value} onChange={(v) => onChange(v as FitMode)} {...rest} />;
}
