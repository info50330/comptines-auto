import React from 'react';
import { Composition } from 'remotion';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import { Comptine, Props } from './Comptine';
import { Avatar, Banner } from './Branding';

const FPS = 30;
const defaults: Props = {
  title: 'Comptine', subtitle: '', channel: '', beat: 0.6, total: 10,
  intro: { start: 0, end: 3 }, sung: [], singalong: [], scene: { background: 'meadow', character: 'bear', color: '#c98b5a' },
};

export const Root: React.FC = () => (
  <>
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
  <Composition
    id="ComptineShort"
    component={Comptine}
    fps={FPS}
    width={1080}
    height={1920}
    durationInFrames={300}
    defaultProps={defaults}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(props.total * FPS) })}
  />
  <Composition id="Avatar" component={Avatar} fps={FPS} width={800} height={800} durationInFrames={1} />
  <Composition id="Banner" component={Banner} fps={FPS} width={2560} height={1440} durationInFrames={1} />
  </>
);
