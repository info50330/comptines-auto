import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CharacterStill } from './Comptine';

const FONT = 'Fredoka, Poppins, sans-serif';
const RAINBOW = ['#ff6fa5', '#ffb02e', '#43b581', '#6a8dff', '#b17bff'];

const Rainbow: React.FC<{ text: string; size: number; stroke: number }> = ({ text, size, stroke }) => (
  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: size, display: 'flex', justifyContent: 'center' }}>
    {text.split('').map((c, i) => (
      <span key={i} style={{ whiteSpace: 'pre', color: RAINBOW[i % 5], WebkitTextStroke: `${stroke}px #fff`, paintOrder: 'stroke fill',
        textShadow: `0 ${size / 18}px 0 rgba(30,30,80,0.25)`, display: 'inline-block', transform: `translateY(${Math.sin(i * 0.9) * size * 0.06}px)` }}>{c}</span>
    ))}
  </div>
);

// Photo de profil 800×800 (YouTube l'affiche en rond)
export const Avatar: React.FC = () => (
  <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #bfe6ff, #7ec8f2)' }}>
    <svg width={800} height={800} style={{ position: 'absolute' }}>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        return <text key={i} x={400 + Math.cos(a) * 300 - 22} y={400 + Math.sin(a) * 300 + 22} fontSize={64}
          fill={RAINBOW[i % 5]} fontFamily="DejaVu Sans">{i % 2 ? '♪' : '♫'}</text>;
      })}
      <path d="M0 640 Q 400 560 800 640 V800 H0 Z" fill="#7cc76a" />
      <CharacterStill kind="kid" color="#ff6fa5" x={290} y={700} s={1.25} />
      <CharacterStill kind="bunny" color="#ffffff" x={545} y={705} s={0.95} flip />
    </svg>
  </AbsoluteFill>
);

// Bannière 2560×1440 ; zone toujours visible au centre : 1546×423
export const Banner: React.FC = () => (
  <AbsoluteFill style={{ background: 'linear-gradient(#7ec8f2, #d6f1ff)' }}>
    <svg width={2560} height={1440} style={{ position: 'absolute' }}>
      <path d="M0 900 Q 640 820 1280 880 T 2560 860 V1440 H0 Z" fill="#7cc76a" />
      <path d="M0 960 Q 800 900 1600 960 T 2560 950 V1440 H0 Z" fill="#5fb057" />
      <CharacterStill kind="bear" color="#c98b5a" x={290} y={1010} s={1.0} />
      <CharacterStill kind="cat" color="#f2b880" x={475} y={1000} s={0.8} />
      <CharacterStill kind="duck" color="#ffe066" x={2090} y={1000} s={0.8} flip />
      <CharacterStill kind="frog" color="#7bd389" x={2275} y={1010} s={1.0} flip />
      {Array.from({ length: 12 }, (_, i) => (
        <text key={i} x={300 + i * 180} y={420 + Math.sin(i) * 60} fontSize={56} fill={RAINBOW[i % 5]} opacity={0.55}
          fontFamily="DejaVu Sans">{i % 2 ? '♪' : '♫'}</text>
      ))}
    </svg>
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 60 }}>
      <Rainbow text="La Ronde des Petits" size={150} stroke={9} />
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 58, color: '#2d3a8c', marginTop: 6 }}>
        Une comptine chaque jour 🎵 À toi de chanter !
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
