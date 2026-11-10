#!/usr/bin/env python3
"""Programme la vidéo du jour sur YouTube (Shorts) via l'API Buffer.

Usage : BUFFER_API_KEY=... python3 engine/buffer_post.py <id> <video_url> [--now]
La clé n'est JAMAIS écrite dans le dépôt : elle est lue dans la variable d'environnement.
Lit out/<id>/youtube.json (titre, description) et config.json (chaîne Buffer, heure).
"""
import datetime as dt, json, os, sys, urllib.request
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = 'https://api.buffer.com'

MUTATION = """
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id status dueAt } }
    ... on MutationError { message }
  }
}"""


def call(key, query, variables=None):
    req = urllib.request.Request(API, data=json.dumps({'query': query, 'variables': variables or {}}).encode(),
                                 headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {key}'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def due_time(cfg, now_mode):
    tz = ZoneInfo(cfg.get('timezone', 'Europe/Paris'))
    now = dt.datetime.now(tz)
    if now_mode:
        when = now + dt.timedelta(minutes=10)
    else:
        h, m = map(int, cfg.get('publish_time', '17:30').split(':'))
        when = now.replace(hour=h, minute=m, second=0, microsecond=0)
        if when < now + dt.timedelta(minutes=15):
            when = now + dt.timedelta(minutes=30)
    return when.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z'), when


def main():
    vid, url = sys.argv[1], sys.argv[2]
    now_mode = '--now' in sys.argv
    key = os.environ.get('BUFFER_API_KEY')
    if not key:
        sys.exit('BUFFER_API_KEY manquante')
    cfg = json.load(open(os.path.join(ROOT, 'config.json'), encoding='utf-8'))
    yt = json.load(open(os.path.join(ROOT, 'out', vid, 'youtube.json'), encoding='utf-8'))
    due_utc, local = due_time(cfg, now_mode)
    variables = {'input': {
        'channelId': cfg['buffer_channel_id'],
        'text': yt['description'],
        'schedulingType': 'automatic',
        'mode': 'customScheduled',
        'dueAt': due_utc,
        'needsApproval': False,
        'assets': [{'video': {'url': url}}],
        'metadata': {'youtube': {
            'title': yt['title'][:100],
            'privacy': 'public',
            'madeForKids': True,
            'categoryId': '27',          # Éducation
            'notifySubscribers': True,
            'embeddable': True,
            'isAiGenerated': False,
        }},
    }}
    res = call(key, MUTATION, variables)
    if res.get('errors'):
        sys.exit('Erreur Buffer : ' + json.dumps(res['errors'], ensure_ascii=False))
    out = res['data']['createPost']
    if 'message' in out:
        sys.exit('Erreur Buffer : ' + out['message'])
    print(json.dumps({'post_id': out['post']['id'], 'status': out['post']['status'],
                      'publication': local.strftime('%d/%m/%Y %H:%M'), 'dueAt': out['post']['dueAt']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
