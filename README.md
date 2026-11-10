# Comptines automatiques

Fabrique chaque jour une vidéo de comptine pour enfants (musique, voix, animation, paroles à l'écran)
et la programme sur YouTube via Metricool.

- `songs/` : une fiche par comptine (paroles, mélodie, décor)
- `engine/audio.py` : compose la musique et la voix, calcule le minutage
- `engine/describe.py` : titre, description et mots-clés YouTube
- `src/` : l'animation (Remotion)
- `make.sh` : fabrique la vidéo d'une comptine
- `publish_video.sh` : met la vidéo en ligne pour Metricool (branche `videos`)
- `catalog.json` : comptines à faire / faites
- `JOURNAL.md` : historique des publications
- `RUN.md` : consignes suivies par la tâche quotidienne
- `config.json` : nom de la chaîne, marque Metricool, heure de publication

Essai local : `./setup.sh` puis `./make.sh songs/frere-jacques.json`.

Crédits : comptines traditionnelles (domaine public) ; voix Piper « Siwis » (CC BY 4.0) ;
outil vidéo Remotion (licence gratuite pour particuliers et entreprises jusqu'à 3 personnes).
