import { ScalePreview } from '@stiletdekor/ui';

export const Banner = () => <ScalePreview widthCm={200} heightCm={100} />;

export const RollUpWithArtwork = () => {
  const artwork =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="#1d3b6e"/><rect y="150" width="400" height="50" fill="#f2c230"/><circle cx="330" cy="70" r="38" fill="#f2c230"/><text x="28" y="100" font-family="Arial" font-size="52" font-weight="700" fill="#fff">NYITÁS</text></svg>',
    );
  return <ScalePreview widthCm={85} heightCm={200} stand imageUrl={artwork} />;
};

export const BoardWithHoles = () => (
  <ScalePreview
    widthCm={60}
    heightCm={40}
    elevationCm={110}
    marks={[
      { x: 2, y: 2 },
      { x: 58, y: 2 },
      { x: 2, y: 38 },
      { x: 58, y: 38 },
    ]}
  />
);

export const WideBannerFitted = () => {
  const artwork =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><rect width="400" height="200" fill="#1d3b6e"/><text x="28" y="120" font-family="Arial" font-size="64" font-weight="700" fill="#f2c230">AKCIÓ</text></svg>',
    );
  return <ScalePreview widthCm={500} heightCm={100} imageUrl={artwork} fit="fit" />;
};
