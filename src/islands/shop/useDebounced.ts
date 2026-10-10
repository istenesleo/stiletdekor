// The value after it has stopped changing for `ms` milliseconds: the configurator announces its price this way, so a
// screen reader does not read every keystroke's price.
import { useEffect, useState } from 'react';

export function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}
