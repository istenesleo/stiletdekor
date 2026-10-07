import { useState } from 'react';
import { SizeFields } from '@stiletdekor/ui';

export const FromFile = () => {
  const [width, setWidth] = useState('200');
  const [height, setHeight] = useState('100');
  return (
    <SizeFields
      width={width}
      height={height}
      onWidthChange={setWidth}
      onHeightChange={setHeight}
      onSwap={() => {
        setWidth(height);
        setHeight(width);
      }}
      fromFile
    />
  );
};

export const WithError = () => (
  <SizeFields width="620" height="100" onWidthChange={() => {}} onHeightChange={() => {}} error="A szélesség legfeljebb 500 cm lehet." />
);
