import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';

export type Line = { start: number; end: number; text: string };
export type Scene = {
  background: string;       // meadow | night | sea | forest | snow | farm
  character: string;        // bear | cat | bunny | mouse | pig | frog | duck | kid
  color: string;            // couleur du personnage principal
  friend?: string;          // second personnage (optionnel)
  friendColor?: string;
  prop?: string;            // tower | house | boat | tree | moon | none
  particles?: string;       // notes | stars | bubbles | leaves | snow | hearts | none
  sleepUntilLine?: number;  // le personnage dort jusqu'à cette ligne chantée
  accent?: string;          // couleur des titres
};
export type Props = {
  title: string; subtitle: string; channel: string;
  beat: number; total: number;
  intro: { start: number; end: number };
  sung: Line[]; singalong: Line[];
  scene: Scene;
};

const FONT = 'Fredoka, Poppins, sans-serif';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const RAINBOW = ['#ff6fa5', '#ffb02e', '#43b581', '#6a8dff', '#b17bff'];

const SKIES: Record<string, [string, string]> = {
  meadow: ['#7ec8f2', '#d6f1ff'], night: ['#1b2559', '#4b4a8f'], sea: ['#8fd3ff', '#e9f8ff'],
  forest: ['#9ad9c0', '#eefbe8'], snow: ['#a9cdf0', '#f2f8ff'], farm: ['#ffc69a', '#fff1d6'],
};

// ---------- Décor ----------
const Sky: React.FC<{ bg: string; t: number }> = ({ bg, t }) => {
  const [a, b] = SKIES[bg] ?? SKIES.meadow;
  const night = bg === 'night';
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${a}, ${b})` }}>
      <svg width={1920} height={1080}>
        {night && Array.from({ length: 45 }, (_, i) => (
          <circle key={i} cx={(i * 397) % 1920} cy={(i * 211) % 560} r={(2 + (i % 3)) * (0.7 + 0.3 * Math.sin(t * 3 + i))} fill="#fff8d0" />
        ))}
        {night ? <Moon t={t} /> : <Sun t={t} pale={bg === 'snow'} />}
        {!night && <Clouds t={t} />}
      </svg>
    </AbsoluteFill>
  );
};

const Sun: React.FC<{ t: number; pale: boolean }> = ({ t, pale }) => (
  <g transform="translate(1720 170) scale(0.85)">
    <g transform={`rotate(${t * 18})`}>
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={-8} y={-150} width={16} height={46} rx={8} fill={pale ? '#ffe28a' : '#ffc93c'} transform={`rotate(${i * 30})`} />
      ))}
    </g>
    <circle r={90} fill={pale ? '#ffeaa0' : '#ffd84d'} />
    <circle cx={-30} cy={-12} r={9} fill="#7a4a12" />
    <circle cx={30} cy={-12} r={9} fill="#7a4a12" />
    <path d="M -32 28 Q 0 58 32 28" stroke="#7a4a12" strokeWidth={8} fill="none" strokeLinecap="round" />
    <circle cx={-55} cy={22} r={14} fill="#ff9f7a" opacity={0.6} />
    <circle cx={55} cy={22} r={14} fill="#ff9f7a" opacity={0.6} />
  </g>
);

const Moon: React.FC<{ t: number }> = ({ t }) => (
  <g transform={`translate(1700 ${180 + Math.sin(t) * 6})`}>
    <circle r={95} fill="#fff1b8" />
    <circle cx={-30} cy={-25} r={14} fill="#f1df98" />
    <circle cx={35} cy={30} r={10} fill="#f1df98" />
    <path d="M -38 0 Q -28 10 -18 0" stroke="#8a7440" strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M 18 0 Q 28 10 38 0" stroke="#8a7440" strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M -18 32 Q 0 46 18 32" stroke="#8a7440" strokeWidth={6} fill="none" strokeLinecap="round" />
  </g>
);

const Cloud: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#ffffff" opacity={0.93}>
    <ellipse cx={0} cy={0} rx={90} ry={45} />
    <ellipse cx={-60} cy={15} rx={60} ry={35} />
    <ellipse cx={65} cy={15} rx={65} ry={35} />
    <ellipse cx={10} cy={-30} rx={55} ry={40} />
  </g>
);

const Clouds: React.FC<{ t: number }> = ({ t }) => {
  const pos = (s: number, v: number) => ((s + t * v) % 2300) - 200;
  return (
    <>
      <Cloud x={pos(200, 24)} y={130} s={1} />
      <Cloud x={pos(1100, 15)} y={260} s={0.7} />
      <Cloud x={pos(1700, 19)} y={80} s={0.8} />
    </>
  );
};

const Flower: React.FC<{ x: number; y: number; c: string }> = ({ x, y, c }) => (
  <g transform={`translate(${x} ${y})`}>
    <line x1={0} y1={0} x2={0} y2={-28} stroke="#3f8a3a" strokeWidth={4} />
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse key={a} cx={0} cy={-40} rx={7} ry={13} fill={c} transform={`rotate(${a} 0 -28)`} />
    ))}
    <circle cx={0} cy={-28} r={6} fill="#ffb03b" />
  </g>
);

const Tree: React.FC<{ x: number; y: number; s: number; pine?: boolean; snow?: boolean }> = ({ x, y, s, pine, snow }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-14} y={-80} width={28} height={80} rx={8} fill="#8a5a3c" />
    {pine ? (
      <>
        <path d="M -90 -60 L 0 -200 L 90 -60 Z" fill="#2f8f5b" />
        <path d="M -70 -130 L 0 -250 L 70 -130 Z" fill="#37a067" />
        {snow && <path d="M -40 -190 L 0 -250 L 40 -190 Q 0 -175 -40 -190 Z" fill="#ffffff" />}
      </>
    ) : (
      <>
        <circle cx={0} cy={-150} r={85} fill="#4fae5b" />
        <circle cx={-55} cy={-110} r={55} fill="#5cbd66" />
        <circle cx={55} cy={-110} r={55} fill="#5cbd66" />
        <circle cx={-25} cy={-170} r={10} fill="#ff6f6f" />
        <circle cx={35} cy={-125} r={10} fill="#ff6f6f" />
      </>
    )}
  </g>
);

const Ground: React.FC<{ bg: string; t: number }> = ({ bg, t }) => {
  if (bg === 'sea') {
    const wave = (y: number, amp: number, ph: number) => {
      let d = `M 0 ${y}`;
      for (let x = 0; x <= 1920; x += 40) d += ` L ${x} ${y + Math.sin(x / 90 + t * 2 + ph) * amp}`;
      return d + ' L 1920 1080 L 0 1080 Z';
    };
    return (
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        <path d={wave(640, 12, 0)} fill="#4aa8e8" />
        <path d={wave(700, 14, 1.5)} fill="#3a94d6" />
        <path d="M0 860 Q 600 800 1200 850 T 1920 830 V1080 H0 Z" fill="#f6dc9b" />
        {[200, 700, 1300, 1750].map((x, i) => (
          <g key={x} transform={`translate(${x} ${940 + (i % 2) * 40})`}>
            <path d="M -18 0 Q 0 -30 18 0 Z" fill={RAINBOW[i]} />
          </g>
        ))}
      </svg>
    );
  }
  const palettes: Record<string, [string, string]> = {
    meadow: ['#7cc76a', '#5fb057'], night: ['#2f5a6a', '#264c5a'], forest: ['#5dae63', '#4a9a52'],
    snow: ['#f4f8ff', '#e3edf9'], farm: ['#9ccc65', '#86b852'],
  };
  const [c1, c2] = palettes[bg] ?? palettes.meadow;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>
      {bg === 'forest' && [80, 330, 1180, 1420, 1820].map((x, i) => <Tree key={x} x={x} y={760} s={0.9 + (i % 2) * 0.25} pine={i % 2 === 1} />)}
      {bg === 'snow' && [120, 380, 1250, 1800].map((x, i) => <Tree key={x} x={x} y={760} s={0.8 + (i % 2) * 0.3} pine snow />)}
      <path d="M0 760 Q 480 660 960 740 T 1920 720 V1080 H0 Z" fill={c1} />
      <path d="M0 830 Q 600 760 1200 830 T 1920 810 V1080 H0 Z" fill={c2} />
      {(bg === 'meadow' || bg === 'farm') && Array.from({ length: 9 }, (_, i) => (
        <Flower key={i} x={110 + i * 215} y={880 + (i % 2) * 40} c={['#ff8fb1', '#ffd84d', '#ffffff', '#b59cff'][i % 4]} />
      ))}
      {bg === 'farm' && (
        <g>
          {Array.from({ length: 14 }, (_, i) => <rect key={i} x={20 + i * 70} y={700} width={16} height={90} rx={4} fill="#d8a46a" />)}
          <rect x={10} y={720} width={1000} height={14} rx={6} fill="#c98f52" />
          <rect x={10} y={760} width={1000} height={14} rx={6} fill="#c98f52" />
        </g>
      )}
      {bg === 'night' && Array.from({ length: 6 }, (_, i) => {
        const fx = 200 + i * 300 + Math.sin(t + i) * 40, fy = 640 + Math.cos(t * 1.3 + i) * 30;
        return <circle key={i} cx={fx} cy={fy} r={6} fill="#fff7a0" opacity={0.5 + 0.5 * Math.sin(t * 4 + i)} />;
      })}
    </svg>
  );
};

// ---------- Accessoire (à droite) ----------
const Prop: React.FC<{ kind?: string; t: number; beat: number; ringing: boolean }> = ({ kind, t, beat, ringing }) => {
  if (!kind || kind === 'none') return null;
  const swing = ringing ? Math.sin((t / beat) * Math.PI) * 28 : 0;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>
      <g transform="translate(1500 0)">
        {kind === 'tower' && (
          <g>
            <rect x={-110} y={420} width={220} height={420} fill="#f2e1c9" stroke="#c9a77c" strokeWidth={6} />
            <path d="M -150 430 L 0 250 L 150 430 Z" fill="#d9534f" />
            <rect x={-70} y={470} width={140} height={150} rx={70} fill="#5a3d2b" />
            <g transform={`translate(0 485) rotate(${swing})`}>
              <rect x={-4} y={0} width={8} height={30} fill="#7a5a30" />
              <path d="M -48 120 Q -44 40 0 30 Q 44 40 48 120 Z" fill="#ffcc33" stroke="#d99a00" strokeWidth={5} />
              <circle cx={0} cy={128} r={12} fill="#d99a00" />
            </g>
            <rect x={-40} y={690} width={80} height={150} rx={40} fill="#8a5a3c" />
          </g>
        )}
        {kind === 'house' && (
          <g>
            {[0, 1, 2].map((i) => {
              const p = ((t * 0.5 + i / 3) % 1);
              return <circle key={i} cx={70 + Math.sin(p * 6) * 15} cy={330 - p * 200} r={18 + p * 20} fill="#ffffff" opacity={0.7 * (1 - p)} />;
            })}
            <rect x={45} y={330} width={50} height={90} fill="#a0522d" />
            <rect x={-170} y={500} width={340} height={300} rx={10} fill="#ffe2b8" />
            <path d="M -210 510 L 0 330 L 210 510 Z" fill="#e8505b" />
            <rect x={-40} y={650} width={80} height={150} rx={40} fill="#8a5a3c" />
            <rect x={-140} y={560} width={80} height={70} rx={10} fill="#8fd3ff" stroke="#fff" strokeWidth={6} />
            <rect x={60} y={560} width={80} height={70} rx={10} fill="#8fd3ff" stroke="#fff" strokeWidth={6} />
          </g>
        )}
        {kind === 'boat' && (
          <g transform={`translate(-80 ${650 + Math.sin(t * 2) * 10}) rotate(${Math.sin(t * 1.6) * 4})`}>
            <path d="M -170 0 L 170 0 L 120 80 L -120 80 Z" fill="#d9534f" />
            <rect x={-170} y={-8} width={340} height={16} rx={8} fill="#ffffff" />
            <rect x={-6} y={-260} width={12} height={260} fill="#8a5a3c" />
            <path d="M 10 -250 L 150 -40 L 10 -40 Z" fill="#ffffff" />
            <path d="M -10 -220 L -120 -40 L -10 -40 Z" fill="#ffd84d" />
            <circle cx={-80} cy={40} r={14} fill="#ffffff" />
            <circle cx={80} cy={40} r={14} fill="#ffffff" />
          </g>
        )}
        {kind === 'tree' && <Tree x={0} y={800} s={1.6} />}
        {kind === 'moon' && (
          <g transform={`translate(0 ${520 + Math.sin(t) * 12})`}>
            <circle r={150} fill="#fff1b8" />
            <circle cx={-50} cy={-40} r={20} fill="#f1df98" />
            <circle cx={55} cy={45} r={14} fill="#f1df98" />
            <path d="M -60 0 Q -45 15 -30 0" stroke="#8a7440" strokeWidth={8} fill="none" strokeLinecap="round" />
            <path d="M 30 0 Q 45 15 60 0" stroke="#8a7440" strokeWidth={8} fill="none" strokeLinecap="round" />
            <path d="M -25 50 Q 0 70 25 50" stroke="#8a7440" strokeWidth={8} fill="none" strokeLinecap="round" />
          </g>
        )}
      </g>
    </svg>
  );
};

// ---------- Personnages (originaux) ----------
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

const Character: React.FC<{
  kind: string; color: string; x: number; y: number; s: number; t: number; beat: number;
  asleep: boolean; singing: boolean; wakeT: number; flip?: boolean;
}> = ({ kind, color, x, y, s, t, beat, asleep, singing, wakeT, flip }) => {
  const { fps } = useVideoConfig();
  const ph = (t / beat) * Math.PI;
  const hop = asleep ? 0 : Math.abs(Math.sin(ph)) * -18;
  const sway = asleep ? Math.sin(t * 1.5) * 3 : Math.sin(ph / 2) * 6;
  const jump = !asleep && wakeT > 0 ? spring({ frame: Math.round((t - wakeT) * fps), fps, config: { damping: 7 } }) : 1;
  const armA = asleep ? 10 : Math.sin(ph) * 35;
  const dark = shade(color, 0.75);
  const light = shade(color, 1.25);
  const mouthOpen = singing && !asleep ? 6 + Math.abs(Math.sin(ph * 2)) * 12 : 0;
  const skin = kind === 'kid' ? '#ffd7b5' : color;
  return (
    <g transform={`translate(${x} ${y + hop - (1 - Math.min(1, jump)) * 0}) scale(${flip ? -s : s} ${s}) rotate(${sway})`}>
      <ellipse cx={0} cy={4} rx={85} ry={14} fill="rgba(0,0,0,0.12)" />
      {/* pieds */}
      <ellipse cx={-35} cy={-8} rx={30} ry={16} fill={kind === 'duck' ? '#ff9a1f' : dark} />
      <ellipse cx={35} cy={-8} rx={30} ry={16} fill={kind === 'duck' ? '#ff9a1f' : dark} />
      {/* corps */}
      <ellipse cx={0} cy={-85} rx={72} ry={80} fill={kind === 'kid' ? color : skin} />
      <ellipse cx={0} cy={-70} rx={44} ry={50} fill={kind === 'kid' ? light : shade(skin, 1.3)} opacity={0.85} />
      {/* bras */}
      <g transform={`translate(-62 -110) rotate(${-armA - 20})`}>
        <ellipse cx={-10} cy={30} rx={18} ry={38} fill={kind === 'kid' ? color : skin} />
      </g>
      <g transform={`translate(62 -110) rotate(${armA + 20})`}>
        <ellipse cx={10} cy={30} rx={18} ry={38} fill={kind === 'kid' ? color : skin} />
      </g>
      {/* tête */}
      <g transform="translate(0 -235)">
        {kind === 'cat' && (
          <>
            <path d="M -85 -40 L -70 -120 L -20 -80 Z" fill={skin} />
            <path d="M 85 -40 L 70 -120 L 20 -80 Z" fill={skin} />
            <path d="M -72 -55 L -66 -100 L -38 -78 Z" fill="#ffb3c6" />
            <path d="M 72 -55 L 66 -100 L 38 -78 Z" fill="#ffb3c6" />
          </>
        )}
        {kind === 'bear' && (
          <>
            <circle cx={-68} cy={-70} r={34} fill={skin} />
            <circle cx={68} cy={-70} r={34} fill={skin} />
            <circle cx={-68} cy={-70} r={18} fill={light} />
            <circle cx={68} cy={-70} r={18} fill={light} />
          </>
        )}
        {kind === 'bunny' && (
          <>
            <ellipse cx={-38} cy={-140} rx={24} ry={70} fill={skin} transform={`rotate(${-8 + Math.sin(ph) * 6} -38 -80)`} />
            <ellipse cx={38} cy={-140} rx={24} ry={70} fill={skin} transform={`rotate(${8 - Math.sin(ph) * 6} 38 -80)`} />
            <ellipse cx={-38} cy={-140} rx={11} ry={50} fill="#ffb3c6" transform={`rotate(${-8 + Math.sin(ph) * 6} -38 -80)`} />
            <ellipse cx={38} cy={-140} rx={11} ry={50} fill="#ffb3c6" transform={`rotate(${8 - Math.sin(ph) * 6} 38 -80)`} />
          </>
        )}
        {kind === 'mouse' && (
          <>
            <circle cx={-80} cy={-55} r={50} fill={skin} />
            <circle cx={80} cy={-55} r={50} fill={skin} />
            <circle cx={-80} cy={-55} r={32} fill="#ffb3c6" />
            <circle cx={80} cy={-55} r={32} fill="#ffb3c6" />
          </>
        )}
        {kind === 'pig' && (
          <>
            <path d="M -80 -50 L -60 -105 L -30 -75 Z" fill={dark} />
            <path d="M 80 -50 L 60 -105 L 30 -75 Z" fill={dark} />
          </>
        )}
        {kind === 'frog' && (
          <>
            <circle cx={-45} cy={-75} r={36} fill={skin} />
            <circle cx={45} cy={-75} r={36} fill={skin} />
          </>
        )}
        <circle r={95} fill={skin} />
        {kind === 'kid' && (
          <>
            <path d="M -92 -15 Q -80 -100 0 -100 Q 80 -100 92 -15 Q 60 -60 0 -62 Q -60 -60 -92 -15 Z" fill="#8a5a3c" />
            {asleep ? (
              <>
                <path d="M -92 -30 Q -10 -150 95 -45 L 82 -28 Q 0 -85 -92 -30 Z" fill={color} />
                <path d="M 82 -45 Q 140 -80 175 -20 L 158 -12 Q 125 -60 88 -32 Z" fill={color} />
                <circle cx={172} cy={-14} r={18} fill="#ffffff" />
              </>
            ) : (
              <>
                <path d="M -97 -25 Q -100 -150 0 -152 Q 100 -150 97 -25 Q 0 -62 -97 -25 Z" fill={color} />
                <path d="M -97 -25 Q 0 -62 97 -25 L 95 -8 Q 0 -45 -95 -8 Z" fill={shade(color, 1.25)} />
                <circle cx={0} cy={-152} r={22} fill={shade(color, 1.25)} />
              </>
            )}
          </>
        )}
        {kind === 'duck' && (
          <path d={`M -10 -95 Q 0 -${130 + Math.sin(ph) * 8} 20 -110 Q 10 -100 8 -92 Z`} fill={dark} />
        )}
        {/* yeux */}
        {(() => {
          const ey = kind === 'frog' ? -75 : -10;
          const ex = kind === 'frog' ? 45 : 32;
          if (asleep) {
            return (
              <>
                <path d={`M ${-ex - 12} ${ey} Q ${-ex} ${ey + 10} ${-ex + 12} ${ey}`} stroke="#2b2b3a" strokeWidth={6} fill="none" strokeLinecap="round" />
                <path d={`M ${ex - 12} ${ey} Q ${ex} ${ey + 10} ${ex + 12} ${ey}`} stroke="#2b2b3a" strokeWidth={6} fill="none" strokeLinecap="round" />
              </>
            );
          }
          const blink = Math.sin(t * 1.7) > 0.985 ? 0.15 : 1;
          return (
            <>
              {kind === 'frog' && (<><circle cx={-ex} cy={ey} r={22} fill="#fff" /><circle cx={ex} cy={ey} r={22} fill="#fff" /></>)}
              <ellipse cx={-ex} cy={ey} rx={12} ry={14 * blink} fill="#2b2b3a" />
              <ellipse cx={ex} cy={ey} rx={12} ry={14 * blink} fill="#2b2b3a" />
              <circle cx={-ex + 4} cy={ey - 5} r={4} fill="#fff" />
              <circle cx={ex + 4} cy={ey - 5} r={4} fill="#fff" />
            </>
          );
        })()}
        {/* joues */}
        <circle cx={-58} cy={25} r={15} fill="#ff8fa3" opacity={0.55} />
        <circle cx={58} cy={25} r={15} fill="#ff8fa3" opacity={0.55} />
        {/* museau / bec / bouche */}
        {kind === 'pig' && (
          <g>
            <ellipse cx={0} cy={18} rx={34} ry={24} fill={light} />
            <ellipse cx={-11} cy={18} rx={6} ry={9} fill={dark} />
            <ellipse cx={11} cy={18} rx={6} ry={9} fill={dark} />
          </g>
        )}
        {kind === 'duck' ? (
          <g>
            <ellipse cx={0} cy={22} rx={42} ry={16} fill="#ff9a1f" />
            <ellipse cx={0} cy={30 + mouthOpen / 3} rx={34} ry={10 + mouthOpen / 3} fill="#e8820f" />
          </g>
        ) : (
          <>
            {(kind === 'bear' || kind === 'mouse' || kind === 'cat' || kind === 'bunny') && (
              <ellipse cx={0} cy={22} rx={11} ry={8} fill="#5a3a2a" />
            )}
            {mouthOpen > 0 ? (
              <ellipse cx={0} cy={kind === 'pig' ? 55 : 45} rx={14} ry={mouthOpen / 1.6} fill="#a8324a" />
            ) : asleep ? (
              <ellipse cx={0} cy={45} rx={7} ry={6} fill="#a8324a" />
            ) : (
              <path d={`M -22 ${kind === 'pig' ? 48 : 38} Q 0 ${kind === 'pig' ? 66 : 56} 22 ${kind === 'pig' ? 48 : 38}`} stroke="#5a2a2a" strokeWidth={6} fill="none" strokeLinecap="round" />
            )}
          </>
        )}
      </g>
    </g>
  );
};

// ---------- Particules ----------
const Particles: React.FC<{ kind?: string; t: number }> = ({ kind, t }) => {
  if (!kind || kind === 'none') return null;
  const n = kind === 'snow' ? 40 : 14;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute' }}>
      {Array.from({ length: n }, (_, i) => {
        const speed = 0.08 + (i % 5) * 0.02;
        const p = (t * speed + i / n) % 1;
        const x = ((i * 523) % 1800) + 60 + Math.sin(t + i) * 30;
        const falling = kind === 'snow' || kind === 'leaves';
        const y = falling ? -40 + p * 1160 : 1100 - p * 1100;
        const op = Math.sin(p * Math.PI) * 0.9;
        const c = RAINBOW[i % RAINBOW.length];
        if (kind === 'snow') return <circle key={i} cx={x} cy={y} r={4 + (i % 4) * 2} fill="#fff" opacity={0.9} />;
        if (kind === 'bubbles') return <circle key={i} cx={x} cy={y} r={14 + (i % 3) * 8} fill="rgba(255,255,255,0.25)" stroke="#fff" strokeWidth={3} opacity={op} />;
        if (kind === 'leaves') return <ellipse key={i} cx={x} cy={y} rx={14} ry={7} fill={['#f2a33a', '#e8662f', '#d9b03a'][i % 3]} transform={`rotate(${t * 90 + i * 40} ${x} ${y})`} />;
        if (kind === 'stars') return <text key={i} x={x} y={y} fontSize={34} fill="#ffe680" opacity={op}>★</text>;
        if (kind === 'hearts') return <text key={i} x={x} y={y} fontSize={38} fill={c} opacity={op}>♥</text>;
        return <text key={i} x={x} y={y} fontSize={44} fill={c} opacity={op} fontFamily="DejaVu Sans">{i % 2 ? '♪' : '♫'}</text>;
      })}
    </svg>
  );
};

const Zzz: React.FC<{ t: number; x: number; y: number }> = ({ t, x, y }) => (
  <svg width={1920} height={1080} style={{ position: 'absolute' }}>
    {[0, 1, 2].map((i) => {
      const p = ((t * 0.45) + i / 3) % 1;
      return (
        <text key={i} x={x + p * 120 + i * 10} y={y - p * 200} fontFamily={FONT} fontWeight={700}
          fontSize={40 + i * 16} fill="#ffffff" opacity={Math.sin(p * Math.PI)} stroke="#3d3a7a" strokeWidth={3}>Z</text>
      );
    })}
  </svg>
);

// ---------- Textes ----------
const Title: React.FC<{ title: string; subtitle: string; f: number; endF: number; accent?: string }> = ({ title, subtitle, f, endF }) => {
  const { fps } = useVideoConfig();
  const out = interpolate(f, [endF - 25, endF], [1, 0], clamp);
  const size = Math.min(150, 1650 / (0.6 * Math.max(6, title.length)));
  return (
    <AbsoluteFill style={{ alignItems: 'center', top: 110, opacity: out }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1700, fontFamily: FONT, fontWeight: 700, fontSize: size }}>
        {title.split('').map((c, i) => {
          const s = spring({ frame: f - i * 2, fps, config: { damping: 10 } });
          const bounce = Math.sin((f - i * 4) / 9) * 8 * s;
          return (
            <span key={i} style={{
              display: 'inline-block', whiteSpace: 'pre', transform: `translateY(${(1 - s) * -300 + bounce}px)`,
              color: RAINBOW[i % 5], WebkitTextStroke: '7px #ffffff', paintOrder: 'stroke fill',
              textShadow: '0 8px 0 rgba(30,30,80,0.25)',
            }}>{c}</span>
          );
        })}
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 52, color: '#fff', marginTop: 12,
        opacity: interpolate(f, [30, 55], [0, 1], clamp), textShadow: '0 3px 10px rgba(0,0,0,0.35)' }}>{subtitle}</div>
    </AbsoluteFill>
  );
};

const Lyrics: React.FC<{ lines: Line[]; t: number; header?: string; accent?: string }> = ({ lines, t, header, accent }) => {
  const { fps } = useVideoConfig();
  if (!lines.length || t < lines[0].start - 0.3 || t > lines[lines.length - 1].end + 0.2) return null;
  let idx = lines.findIndex((l) => t >= l.start && t < l.end);
  if (idx < 0) idx = t < lines[0].start ? 0 : lines.length - 1;
  const l = lines[idx];
  const inLine = Math.max(0, t - l.start);
  const pop = spring({ frame: Math.round(inLine * fps), fps, config: { damping: 12, stiffness: 180 } });
  const progress = interpolate(t, [l.start, l.end - 0.15], [0, 100], clamp);
  const size = Math.min(80, 1500 / (0.55 * Math.max(8, l.text.length)));
  const dots = lines.length <= 16;
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 55 }}>
      {header && (
        <div style={{ position: 'absolute', top: 70, fontFamily: FONT, fontWeight: 700, fontSize: 96, color: accent ?? '#ff6fa5',
          WebkitTextStroke: '6px #fff', paintOrder: 'stroke fill', transform: `rotate(${Math.sin(t * 2.5) * 2}deg)` }}>{header}</div>
      )}
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 48, padding: '20px 70px 28px', boxShadow: '0 14px 0 rgba(40,60,120,0.18)',
        minWidth: 900, maxWidth: 1700, textAlign: 'center', transform: `scale(${0.9 + 0.1 * pop})` }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: size, color: '#2d3a8c', whiteSpace: 'nowrap' }}>{l.text}</div>
        <div style={{ height: 14, borderRadius: 7, background: '#e4e9ff', marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#ffb02e,#ff6fa5)', borderRadius: 7 }} />
        </div>
      </div>
      {dots && (
        <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
          {lines.map((_, i) => (
            <div key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i <= idx ? '#ffb02e' : 'rgba(255,255,255,0.75)' }} />
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- Composition ----------
export const Comptine: React.FC<Props> = (p) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const sc = p.scene;
  const bg = sc.background in SKIES ? sc.background : 'meadow';
  const sleepLine = sc.sleepUntilLine;
  const wakeT = sleepLine != null && p.sung[sleepLine] ? p.sung[sleepLine].start : -1;
  const asleep = wakeT > 0 && t < wakeT;
  const inSung = p.sung.length > 0 && t >= p.sung[0].start && t < p.sung[p.sung.length - 1].end;
  const ringing = sc.prop === 'tower' && (inSung || t >= p.singalong[0]?.start);
  const hasProp = sc.prop && sc.prop !== 'none';
  const groundY = bg === 'sea' ? 770 : 790;
  return (
    <AbsoluteFill>
      <Sky bg={bg} t={t} />
      <Ground bg={bg} t={t} />
      <Prop kind={sc.prop} t={t} beat={p.beat} ringing={ringing} />
      <svg width={1920} height={1080} style={{ position: 'absolute' }}>
        {sc.friend && (
          <Character kind={sc.friend} color={sc.friendColor ?? '#9ad0ff'} x={hasProp ? 1080 : 1450} y={groundY} s={0.8}
            t={t + 0.15} beat={p.beat} asleep={false} singing={inSung} wakeT={-1} flip />
        )}
        <Character kind={sc.character} color={sc.color} x={460} y={groundY} s={1.05} t={t} beat={p.beat}
          asleep={asleep} singing={inSung} wakeT={wakeT} />
      </svg>
      {asleep && <Zzz t={t} x={560} y={430} />}
      <Particles kind={sc.particles} t={t} />
      {f < p.intro.end * fps && <Title title={p.title} subtitle={p.subtitle} f={f} endF={p.intro.end * fps} accent={sc.accent} />}
      <Lyrics lines={p.sung} t={t} />
      <Lyrics lines={p.singalong} t={t} header="À toi de chanter !" accent={sc.accent} />
      {p.channel && (
        <div style={{ position: 'absolute', right: 30, bottom: 22, fontFamily: FONT, fontWeight: 600, fontSize: 28,
          color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>{p.channel}</div>
      )}
    </AbsoluteFill>
  );
};
