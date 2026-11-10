#!/usr/bin/env python3
"""Prépare le titre, la description et les mots-clés YouTube d'une comptine.

Usage : python3 engine/describe.py songs/xxx.json out_dir
Produit out_dir/youtube.json ; lit config.json pour le nom de la chaîne.
"""
import json, os, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(song_path, out_dir):
    song = json.load(open(song_path, encoding='utf-8'))
    cfg = json.load(open(os.path.join(HERE, 'config.json'), encoding='utf-8'))
    chan = cfg.get('channel_name', '')
    title = song['title']

    yt_title = song.get('youtubeTitle') or f"{title} 🎵 Comptine pour enfants avec paroles"
    yt_title = yt_title[:100]

    about = song.get('description') or (
        f"Chantons ensemble « {title} », une comptine traditionnelle française pour les tout-petits ! "
        "Les paroles s'affichent à l'écran pour suivre en rythme, puis c'est à ton tour de chanter."
    )
    lyrics = '\n'.join(l['text'] for l in song['lines'])
    tags_words = song.get('tags', []) + [
        title.lower(), 'comptine', 'comptines', 'comptine pour enfants', 'chanson pour enfants',
        'comptines françaises', 'chansons pour bébé', 'maternelle', 'paroles', 'karaoké enfants',
        'apprendre à chanter', 'éveil musical',
    ]
    # dédoublonne en gardant l'ordre, et respecte la limite YouTube (500 caractères au total)
    seen, tags, total = set(), [], 0
    for t in tags_words:
        t = t.strip()
        if t and t not in seen and total + len(t) + 1 <= 480:
            seen.add(t); tags.append(t); total += len(t) + 1

    hashtags = ' '.join(['#comptine', '#chansonpourenfants', '#' + ''.join(c for c in title.title() if c.isalnum())])

    desc = f"""{about}

🎶 Dans cette vidéo
• La mélodie pour se mettre dans l'ambiance
• La comptine chantée, avec les paroles à l'écran
• « À toi de chanter ! » : la musique seule, pour chanter tout seul ou en famille

📝 Paroles — {title}
{lyrics}

👶 Idéal pour l'éveil musical, la crèche, la maternelle et les moments en famille.
{('🔔 Abonne-toi à ' + chan + ' : une nouvelle comptine chaque jour !') if chan else ''}

ℹ️ Crédits
Comptine traditionnelle française (domaine public).
Animation et arrangement musical originaux{(' — ' + chan) if chan else ''}.
Voix de synthèse : Piper TTS, voix « Siwis » (licence CC BY 4.0).

{hashtags}"""
    desc = desc.replace('\n\n\n', '\n\n')[:4900]

    os.makedirs(out_dir, exist_ok=True)
    out = {'title': yt_title, 'description': desc, 'tags': tags}
    json.dump(out, open(os.path.join(out_dir, 'youtube.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'Description OK ({len(desc)} caractères, {len(tags)} mots-clés)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
