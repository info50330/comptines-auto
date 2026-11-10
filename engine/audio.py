#!/usr/bin/env python3
"""Fabrique la bande-son d'une comptine et le minutage pour la vidéo.

Usage : python3 engine/audio.py songs/xxx.json out_dir
Produit out_dir/audio.wav et out_dir/props.json (lu par Remotion).
"""
import json, math, os, subprocess, sys, tempfile, wave
import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.path.join(HERE, 'voice', 'fr.onnx')

NOTE_BASE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
KEYS = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}


def midi(name):
    """'C4', 'F#4', 'Bb3' -> numéro MIDI ; 'R' -> None (silence)."""
    if name.upper() == 'R':
        return None
    letter, rest = name[0].upper(), name[1:]
    acc = 0
    while rest and rest[0] in '#b':
        acc += 1 if rest[0] == '#' else -1
        rest = rest[1:]
    return 12 * (int(rest) + 1) + NOTE_BASE[letter] + acc


def freq(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def parse_notes(s):
    out = []
    for tok in s.split():
        n, d = tok.split(':')
        out.append((midi(n), float(d)))
    return out


def env(n, a=0.006, r=0.02):
    e = np.ones(n)
    a, r = min(int(a * SR), n // 2), min(int(r * SR), n // 2)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] = np.linspace(1, 0, r)
    return e


def instrument(kind, f, dur):
    n = max(1, int(dur * SR))
    t = np.arange(n) / SR
    if kind == 'piano':
        s = (np.sin(2*np.pi*f*t) + .45*np.sin(4*np.pi*f*t) + .2*np.sin(6*np.pi*f*t)) * np.exp(-t * 3)
    elif kind == 'xylo':
        s = (np.sin(2*np.pi*f*t) + .25*np.sin(2*np.pi*3*f*t)) * np.exp(-t * 7)
    elif kind == 'boite':  # boîte à musique
        s = (np.sin(2*np.pi*2*f*t) + .35*np.sin(2*np.pi*4*f*t)*np.exp(-t*9)) * np.exp(-t * 4.5)
    elif kind == 'flute':
        vib = 1 + 0.004 * np.sin(2*np.pi*5.5*t)
        s = (np.sin(2*np.pi*f*vib*t) + .12*np.sin(4*np.pi*f*vib*t)) * np.minimum(1, t / 0.04)
    else:  # marimba
        s = (np.sin(2*np.pi*f*t) + .3*np.sin(2*np.pi*4*f*t)*np.exp(-t*12)) * np.exp(-t * 4)
    return s * env(n)


def pad(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2*np.pi*f*t) for f in fs) / len(fs)
    return s * env(n, 0.05, 0.12)


def bass(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2*np.pi*f*t) + .3*np.sin(4*np.pi*f*t)) * np.exp(-t * 2.2) * env(n)


def click(kind='kick'):
    n = int(0.12 * SR); t = np.arange(n) / SR
    if kind == 'kick':
        return np.sin(2*np.pi*(90*np.exp(-t*25)+45)*t) * np.exp(-t*30)
    rng = np.random.default_rng(1)
    return rng.standard_normal(n) * np.exp(-t*60) * 0.35


def add(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


def chord_for(segment_pcs, key_pc):
    """Choisit I, IV, V ou vi selon les notes jouées pendant le segment."""
    cands = {0: [0, 4, 7], 5: [5, 9, 0], 7: [7, 11, 2], 9: [9, 0, 4]}
    best, score = 0, -1
    for root, tri in cands.items():
        tri_pc = {(key_pc + x) % 12 for x in tri}
        sc = sum(w for pc, w in segment_pcs if pc in tri_pc) + (0.01 if root == 0 else 0)
        if sc > score:
            best, score = root, sc
    return [(key_pc + x) % 12 for x in cands[best]]


def render_music(lines, start, beat, inst, key_pc, bpb, melody_gain, buf):
    """Joue la mélodie + accompagnement à partir de `start` ; renvoie les débuts/fins de ligne."""
    t = start
    spans = []
    for line in lines:
        notes = parse_notes(line['notes'])
        line_start = t
        cursor = t
        for m, d in notes:
            if m is not None:
                add(buf, melody_gain * instrument(inst, freq(m), d * beat + 0.35), cursor)
            cursor += d * beat
        line_end = cursor
        # accompagnement : un accord par groupe de `group` temps
        group = 2 if bpb == 4 else bpb
        total_beats = sum(d for _, d in notes)
        g = 0.0
        while g < total_beats - 1e-6:
            seg, pos = [], 0.0
            for m, d in notes:
                a, b = pos, pos + d
                ov = max(0, min(b, g + group) - max(a, g))
                if ov > 0 and m is not None:
                    seg.append((m % 12, ov))
                pos = b
            tri = chord_for(seg, key_pc)
            seg_dur = min(group, total_beats - g) * beat
            root = tri[0]
            add(buf, 0.32 * bass(freq(36 + root + (12 if root < 5 else 0)), seg_dur), line_start + g * beat)
            add(buf, 0.10 * pad([freq(60 + p if p >= 4 else 72 + p) for p in tri], seg_dur), line_start + g * beat)
            g += group
        # percussions légères sur les temps
        b = 0
        while b < total_beats - 1e-6:
            add(buf, 0.18 * click('kick' if b % bpb == 0 else 'hat'), line_start + b * beat)
            b += 1
        spans.append((line_start, line_end))
        t = line_end
    return t, spans


def tts(text, length_scale, path):
    subprocess.run([sys.executable, '-m', 'piper', '-m', VOICE, '-f', path, '--length_scale', str(length_scale)],
                   input=text.encode('utf-8'), capture_output=True, check=True)
    w = wave.open(path)
    sr = w.getframerate()
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    # retire les silences au début et à la fin
    nz = np.where(np.abs(a) > 0.02)[0]
    if len(nz):
        a = a[max(0, nz[0] - 200): nz[-1] + 400]
    # rééchantillonne vers SR
    x_new = np.linspace(0, len(a) - 1, int(len(a) * SR / sr))
    return np.interp(x_new, np.arange(len(a)), a)


def voice_line(text, slot, tmpdir, idx):
    ls = 1.0
    for _ in range(4):
        v = tts(text, ls, os.path.join(tmpdir, f'v{idx}.wav'))
        dur = len(v) / SR
        if dur <= slot * 0.92 or ls <= 0.6:
            break
        ls = max(0.6, ls * slot * 0.88 / dur)
    if len(v) / SR > slot * 0.97:
        v = v[: int(slot * 0.97 * SR)]
        v[-800:] *= np.linspace(1, 0, 800)
    return v


def main(song_path, out_dir):
    song = json.load(open(song_path, encoding='utf-8'))
    os.makedirs(out_dir, exist_ok=True)
    beat = 60.0 / song.get('bpm', 100)
    bpb = song.get('beatsPerBar', 4)
    inst = song.get('instrument', 'marimba')
    key_pc = KEYS[song.get('key', 'C')]
    lines = song['lines']
    intro_n = song.get('introLines', 2)
    sung_times = song.get('sungRepeats', 1)

    total_beats = sum(sum(d for _, d in parse_notes(l['notes'])) for l in lines)
    est = (intro_n / len(lines) + sung_times + 1) * total_beats * beat + 6
    buf = np.zeros(int(est * SR))
    t = 0.5
    # 1) introduction instrumentale (premières lignes)
    intro_start = t
    t, _ = render_music(lines[:intro_n], t, beat, inst, key_pc, bpb, 0.55, buf)
    intro = {'start': 0, 'end': t}
    # 2) couplet chanté (voix + musique)
    sung = []
    with tempfile.TemporaryDirectory() as tmp:
        for rep in range(sung_times):
            t, spans = render_music(lines, t, beat, inst, key_pc, bpb, 0.38, buf)
            for i, ((a, b), l) in enumerate(zip(spans, lines)):
                v = voice_line(l['text'], b - a, tmp, i)
                add(buf, 0.95 * v, a + 0.04)
                sung.append({'start': a, 'end': b, 'text': l['text']})
    # 3) « À toi de chanter ! » : musique seule, paroles à l'écran
    t, spans = render_music(lines, t, beat, inst, key_pc, bpb, 0.6, buf)
    singalong = [{'start': a, 'end': b, 'text': l['text']} for (a, b), l in zip(spans, lines)]
    # 4) accord final
    tri = chord_for([], key_pc)
    add(buf, 0.3 * bass(freq(36 + tri[0]), 2.5), t)
    add(buf, 0.18 * pad([freq(60 + p) for p in tri], 2.5), t)
    total = t + 2.8
    buf = buf[: int(total * SR)]
    buf /= max(1e-9, np.abs(buf).max()) * 1.08
    fade = int(1.2 * SR); buf[-fade:] *= np.linspace(1, 0, fade)

    w = wave.open(os.path.join(out_dir, 'audio.wav'), 'w')
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((buf * 32767).astype(np.int16).tobytes()); w.close()

    props = {
        'title': song['title'],
        'subtitle': song.get('subtitle', 'Une comptine à chanter ensemble'),
        'channel': song.get('channel', ''),
        'beat': beat, 'total': total,
        'intro': intro, 'sung': sung, 'singalong': singalong,
        'scene': song.get('scene', {}),
    }
    json.dump(props, open(os.path.join(out_dir, 'props.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'audio OK : {total:.1f} s')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
