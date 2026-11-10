#!/usr/bin/env bash
# Installe tout le nécessaire (à lancer une fois par session cloud).
set -euo pipefail
cd "$(dirname "$0")"
pip install --break-system-packages -q piper-tts numpy
npm install --no-audit --no-fund --loglevel=error
npx remotion browser ensure >/dev/null
mkdir -p engine/voice
if [ ! -s engine/voice/fr.onnx ]; then
  B=https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium
  curl -sSL --retry 3 -o engine/voice/fr.onnx "$B/fr_FR-siwis-medium.onnx"
  curl -sSL --retry 3 -o engine/voice/fr.onnx.json "$B/fr_FR-siwis-medium.onnx.json"
fi
echo "Installation OK"
