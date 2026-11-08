#!/usr/bin/env python3
"""Train the Word2Vec model used by the /word2vec/ explorer page.

Corpus: English text from several NLTK corpora (Brown, Reuters, Project Gutenberg
selections, Europarl English, ABC news, movie reviews, web text, State of the Union,
inaugural addresses, MASC), roughly 10M tokens in total.

Model: gensim Word2Vec, skip-gram with negative sampling.

Output (written to public/word2vec/):
  vocab.json    -> {"dim": D, "words": [...], "counts": [...], "meta": {...}}
  vectors.bin   -> int8 matrix [V x D], each row L2-normalised then scaled to [-127, 127]
  scales.bin    -> float32 [V] per-row dequantisation scale (row = int8 * scale)

Usage:
  pip install gensim numpy
  python3 scripts/train_word2vec.py            # downloads corpora into .cache/
"""
import io
import json
import os
import re
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

import numpy as np
from gensim.models import Word2Vec

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache" / "nltk_corpora"
OUT = ROOT / "public" / "word2vec"
BASE = "https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/"

CORPORA = ["brown", "reuters", "gutenberg", "europarl_raw", "abc", "movie_reviews",
           "webtext", "state_union", "inaugural", "masc_tagged", "genesis"]

DIM = 100          # embedding size
WINDOW = 5         # context window
MIN_COUNT = 5      # ignore rarer words while training
EPOCHS = 15
EXPORT_VOCAB = 25000  # most frequent words shipped to the browser
SEED = 42

TOKEN = re.compile(r"[a-z]+(?:'[a-z]+)?")


def fetch(name):
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{name}.zip"
    if not path.exists():
        print(f"  downloading {name} ...", flush=True)
        urllib.request.urlretrieve(BASE + f"{name}.zip", path)
    return zipfile.ZipFile(path)


def keep(name, member):
    """Pick the plain-text files of each corpus (skip READMEs, metadata, other languages)."""
    low = member.lower()
    if member.endswith("/") or "readme" in low or "license" in low:
        return False
    if name == "europarl_raw":
        return "/english/" in low
    if name == "genesis":
        return low.endswith("english-kjv.txt") or low.endswith("english-web.txt")
    if name == "reuters":
        return "/training/" in low or "/test/" in low
    if name == "masc_tagged":
        return low.endswith(".txt") or "/written/" in low or "/spoken/" in low
    if name in ("abc", "gutenberg", "webtext", "state_union", "inaugural"):
        return low.endswith(".txt")
    if name == "movie_reviews":
        return "/pos/" in low or "/neg/" in low
    if name == "brown":
        return re.search(r"/c[a-r]\d\d$", low) is not None
    return True


BROWN_TAG = re.compile(r"/[^\s]+")
MASC_TAG = re.compile(r"_[^\s]+")


def sentences():
    for name in CORPORA:
        z = fetch(name)
        n = 0
        for member in z.namelist():
            if not keep(name, member):
                continue
            text = z.read(member).decode("utf-8", errors="ignore")
            if name == "brown":
                text = BROWN_TAG.sub("", text)        # strip word/TAG annotations
            elif name == "masc_tagged":
                text = MASC_TAG.sub("", text)
            for line in re.split(r"[\n.!?;:]+", text):
                toks = TOKEN.findall(line.lower())
                if len(toks) > 1:
                    n += len(toks)
                    yield toks
        print(f"  {name:14s} {n:>10,} tokens", flush=True)


def main():
    t0 = time.time()
    print("Reading corpora ...")
    sents = list(sentences())
    total = sum(len(s) for s in sents)
    print(f"Total: {len(sents):,} sentences, {total:,} tokens")

    print("Training skip-gram Word2Vec ...")
    model = Word2Vec(sentences=sents, vector_size=DIM, window=WINDOW, min_count=MIN_COUNT,
                     sg=1, negative=10, sample=1e-4, epochs=EPOCHS, workers=os.cpu_count() or 4,
                     seed=SEED)
    kv = model.wv
    print(f"Vocabulary: {len(kv.index_to_key):,} words ({time.time() - t0:.0f}s)")

    for w in ["king", "money", "happy", "france", "monday", "good", "war", "movie"]:
        if w in kv:
            print(f"  {w:8s} -> {', '.join(x for x, _ in kv.most_similar(w, topn=8))}")

    words = kv.index_to_key[:EXPORT_VOCAB]
    vecs = np.stack([kv[w] for w in words]).astype(np.float32)
    vecs /= np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-9
    scales = np.abs(vecs).max(axis=1) / 127.0
    q = np.round(vecs / scales[:, None]).clip(-127, 127).astype(np.int8)

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "vectors.bin").write_bytes(q.tobytes())
    (OUT / "scales.bin").write_bytes(scales.astype(np.float32).tobytes())
    meta = {
        "algorithm": "word2vec skip-gram, negative sampling (gensim)",
        "corpora": CORPORA, "tokens": total, "sentences": len(sents),
        "trainVocab": len(kv.index_to_key), "dim": DIM, "window": WINDOW,
        "minCount": MIN_COUNT, "epochs": EPOCHS, "negative": 10,
    }
    counts = [int(kv.get_vecattr(w, "count")) for w in words]
    (OUT / "vocab.json").write_text(json.dumps({"dim": DIM, "words": words, "counts": counts, "meta": meta},
                                               separators=(",", ":")))
    print(f"Exported {len(words):,} words to {OUT} in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    sys.exit(main())
