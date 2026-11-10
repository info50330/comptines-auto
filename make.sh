#!/usr/bin/env bash
# Fabrique une vidéo : ./make.sh songs/<id>.json
# Résultat : out/<id>/<id>.mp4 (vidéo) et out/<id>/<id>.jpg (miniature)
set -euo pipefail
cd "$(dirname "$0")"
SONG="$1"
ID=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['id'])" "$SONG")
OUT="out/$ID"
# format : short (vertical 1080×1920, pour Buffer/Shorts) ou long (16:9)
FMT=$(python3 -c "import json;print(json.load(open('config.json')).get('format','short'))")
COMP=$([ "$FMT" = "long" ] && echo Comptine || echo ComptineShort)
mkdir -p "$OUT"
python3 engine/audio.py "$SONG" "$OUT"
python3 engine/describe.py "$SONG" "$OUT"
# le nom de la chaîne s'affiche discrètement en bas de la vidéo
python3 -c "
import json,sys
c=json.load(open('config.json'));p=json.load(open(sys.argv[1]))
p['channel']=c.get('channel_name','');json.dump(p,open(sys.argv[1],'w'),ensure_ascii=False)" "$OUT/props.json"
npx remotion render src/index.ts "$COMP" "$OUT/video.tmp.mp4" --props="$OUT/props.json" \
  --codec=h264 --crf=20 --x264-preset=veryfast --log=error
mv "$OUT/video.tmp.mp4" "$OUT/video_muet.mp4"
ffmpeg -y -loglevel error -i "$OUT/video_muet.mp4" -i "$OUT/audio.wav" -map 0:v -map 1:a \
  -c:v copy -c:a aac -b:a 192k -shortest "$OUT/$ID.mp4"
# miniature : le titre, une fois posé (~2,5 s)
npx remotion still src/index.ts "$COMP" "$OUT/$ID.jpg" --props="$OUT/props.json" --frame=75 \
  --image-format=jpeg --jpeg-quality=92 --log=error
rm -f "$OUT/video_muet.mp4"
echo "Vidéo prête : $OUT/$ID.mp4"
