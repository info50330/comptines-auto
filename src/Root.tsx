import React from 'react';
import { Composition } from 'remotion';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import { Comptine, Props } from './Comptine';

const FPS = 30;
const defaults: Props = {
  title: 'Comptine', subtitle: '', channel: '', beat: 0.6, total: 10,
  intro: { start: 0, end: 3 }, sung: [], singalong: [], scene: { background: 'meadow', character: 'bear', color: '#c98b5a' },
};

export const Root: React.FC = () => (
  <Composition
    id="Comptine"
    component={Comptine}
    fps={FPS}
    width={1920}
    height={1080}
    durationInFrames={300}
    defaultProps={defaults}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(props.total * FPS) })}
  />
);
