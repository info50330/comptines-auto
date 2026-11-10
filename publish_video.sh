#!/usr/bin/env bash
# Met la vidéo et sa miniature en ligne sur la branche « videos » du dépôt
# (branche remplacée à chaque fois : seule la dernière vidéo y reste, le dépôt ne grossit pas).
# Usage : ./publish_video.sh <id>   → affiche les liens publics
set -euo pipefail
cd "$(dirname "$0")"
ID="$1"
REPO_URL=$(git remote get-url origin)
SLUG=$(echo "$REPO_URL" | sed -E 's#.*github.com[/:]##; s#\.git$##')
TMP=$(mktemp -d)
cp "out/$ID/$ID.mp4" "out/$ID/$ID.jpg" "$TMP/"
cd "$TMP"
git init -q -b videos
git -c user.name="comptines-auto" -c user.email="comptines-auto@users.noreply.github.com" add .
git -c user.name="comptines-auto" -c user.email="comptines-auto@users.noreply.github.com" commit -q -m "Vidéo du jour : $ID"
git push -q --force "$REPO_URL" videos:videos
cd - >/dev/null
rm -rf "$TMP"
echo "VIDEO_URL=https://raw.githubusercontent.com/$SLUG/videos/$ID.mp4"
echo "THUMB_URL=https://raw.githubusercontent.com/$SLUG/videos/$ID.jpg"
