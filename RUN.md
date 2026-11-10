# Consignes de la publication quotidienne

Ce fichier est suivi à la lettre par la tâche programmée qui publie une comptine par jour.
Chaque passage démarre dans un espace vierge : tout ce qu'il faut est dans ce dépôt.

## 0. Préparer
```bash
git clone https://github.com/info50330/comptines-auto ~/comptines-auto && cd ~/comptines-auto
./setup.sh
```
Lire `config.json`. Si `channel_name` ou `buffer_channel_id` est vide, ou si la variable
`BUFFER_API_KEY` n'est pas fournie par la consigne de la tâche : **ne rien publier**, expliquer ce qui manque et s'arrêter.
**La clé Buffer ne doit jamais être écrite dans un fichier du dépôt, ni dans un commit, ni dans le compte rendu.**

## 1. Choisir la comptine
- Dans `catalog.json`, prendre la première chanson `"status": "todo"`.
- S'il n'en reste aucune : ajouter 5 comptines **traditionnelles françaises du domaine public**
  (vérifier par une recherche web qu'il ne s'agit pas d'une chanson d'auteur récent, de dessin animé
  ou d'émission ; en cas de doute, ne pas l'ajouter), puis prendre la première.
- Ne jamais publier deux fois la même comptine avec le même décor.

## 2. Écrire `songs/<id>.json` (s'il n'existe pas déjà)
Suivre le format de `songs/frere-jacques.json` :
- **Paroles** : le premier couplet exact (et le refrain s'il y en a un), vérifié par une recherche web.
  6 à 16 lignes, une ligne = une phrase musicale. Pas de paroles inventées.
- **Mélodie** (`notes`) : vérifier la mélodie par une recherche web (partition ou notation ABC).
  Format `Note+octave:durée_en_temps`, ex. `C4:1 D4:0.5 R:1` (R = silence). Do4 = C4.
  Chaque ligne doit tomber juste sur la mesure (`beatsPerBar` temps, 4 par défaut, 3 pour une valse).
  Garder la mélodie entre G3 et A4 et préciser la tonalité `key` (C, D, F, G…).
- `bpm` : 84 à 112 selon le caractère de la chanson (berceuse lente, ronde plus vive).
- `instrument` : marimba | piano | xylo | boite | flute.
- `scene` — choisir une combinaison qui colle au texte et **différente des 5 dernières vidéos du `JOURNAL.md`** :
  - `background` : meadow | night | sea | forest | snow | farm
  - `character` / `friend` : bear | cat | bunny | mouse | pig | frog | duck | kid (+ `color`, `friendColor` en hexa)
  - `prop` : tower | house | boat | tree | moon | none
  - `particles` : notes | stars | bubbles | leaves | snow | hearts | none
  - `sleepUntilLine` (facultatif) : le personnage dort jusqu'à cette ligne (berceuses, réveils)
  - `accent` : couleur du titre « À toi de chanter ! »
- `description` : 2 phrases chaleureuses qui présentent la comptine (ce qu'elle raconte, à quoi elle sert).
- `tags` : 5 à 8 mots-clés propres à cette comptine.
- `subtitle` : courte phrase sous le titre.

## 3. Fabriquer et vérifier
```bash
./make.sh songs/<id>.json
```
Puis **regarder** 3 images (intro, couplet chanté, « À toi de chanter ! ») avec
`npx remotion still src/index.ts Comptine /tmp/x.jpg --props=out/<id>/props.json --frame=N`
et vérifier : textes lisibles et non coupés, personnages entiers, paroles exactes.
Vérifier aussi `out/<id>/youtube.json` (titre ≤ 100 caractères, description complète avec paroles et crédits).
En cas de problème, corriger le fichier de la chanson et refaire. Si c'est impossible : ne rien publier.

## 4. Mettre la vidéo en ligne
```bash
./publish_video.sh <id>
```
Noter `VIDEO_URL`. Vérifier qu'elle répond (`curl -sI "$VIDEO_URL" | head -1` → 200).

## 5. Programmer sur YouTube (Shorts) via Buffer
```bash
BUFFER_API_KEY=<clé fournie par la consigne de la tâche> python3 engine/buffer_post.py <id> "$VIDEO_URL"
```
Le script programme la vidéo pour aujourd'hui à `publish_time` (ou dans 30 min si l'heure est passée) :
Short public, « conçue pour les enfants », catégorie Éducation, titre et description de `youtube.json`.
Il affiche l'identifiant du post Buffer et l'heure de publication. En cas d'erreur, ne pas réessayer en boucle :
le signaler dans le compte rendu.

## 6. Garder la trace
- `catalog.json` : passer la chanson en `"status": "done"` avec `"date"` et `"buffer_post_id"`.
- `JOURNAL.md` : ajouter une ligne `| date | id | décor | personnages | instrument | post Buffer |`.
- Commit + push sur `main` :
```bash
git add -A && git commit -m "Comptine du jour : <id>" && git fetch origin main && git rebase origin/main && git push origin HEAD:main
```

## 7. Compte rendu
Terminer par 2 ou 3 lignes : comptine publiée, heure de publication, identifiant du post Buffer — ou ce qui a bloqué.
