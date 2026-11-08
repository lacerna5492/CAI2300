// Loads the exported Word2Vec model (see scripts/train_word2vec.py) and answers
// nearest-neighbour / analogy queries with cosine similarity, all in the browser.

const BASE = '/word2vec/';

export async function loadModel() {
  const [vocabRes, vecRes, scaleRes] = await Promise.all([
    fetch(BASE + 'vocab.json'), fetch(BASE + 'vectors.bin'), fetch(BASE + 'scales.bin'),
  ]);
  if (!vocabRes.ok || !vecRes.ok || !scaleRes.ok) throw new Error('Could not download the model files.');
  const vocab = await vocabRes.json();
  const q = new Int8Array(await vecRes.arrayBuffer());
  const scales = new Float32Array(await scaleRes.arrayBuffer());
  const dim = vocab.dim;
  const n = vocab.words.length;
  if (q.length !== n * dim || scales.length !== n) throw new Error('Model files are inconsistent.');

  // De-quantise and re-normalise so a dot product is exactly cosine similarity.
  const vectors = new Float32Array(n * dim);
  for (let i = 0; i < n; i++) {
    let norm = 0;
    const off = i * dim;
    for (let d = 0; d < dim; d++) { const x = q[off + d] * scales[i]; vectors[off + d] = x; norm += x * x; }
    norm = Math.sqrt(norm) || 1;
    for (let d = 0; d < dim; d++) vectors[off + d] /= norm;
  }
  const index = new Map(vocab.words.map((w, i) => [w, i]));
  return new Word2VecModel(vocab.words, vocab.counts, vectors, dim, index, vocab.meta || {});
}

export class Word2VecModel {
  constructor(words, counts, vectors, dim, index, meta) {
    this.words = words; this.counts = counts; this.vectors = vectors; this.dim = dim; this.index = index; this.meta = meta;
    this.size = words.length;
  }

  has(word) { return this.index.has(normalize(word)); }

  vector(word) {
    const i = this.index.get(normalize(word));
    if (i === undefined) return null;
    return this.vectors.subarray(i * this.dim, (i + 1) * this.dim);
  }

  // Top-k words by cosine similarity to `target` (a unit or non-unit vector).
  nearestToVector(target, k = 10, exclude = []) {
    const { dim, vectors, size } = this;
    let norm = 0;
    for (let d = 0; d < dim; d++) norm += target[d] * target[d];
    norm = Math.sqrt(norm) || 1;
    const skip = new Set(exclude.map((w) => this.index.get(normalize(w))).filter((i) => i !== undefined));
    const best = []; // sorted descending, length <= k
    for (let i = 0; i < size; i++) {
      if (skip.has(i)) continue;
      let dot = 0;
      const off = i * dim;
      for (let d = 0; d < dim; d++) dot += vectors[off + d] * target[d];
      const sim = dot / norm;
      if (best.length < k || sim > best[best.length - 1].similarity) {
        let j = best.length < k ? best.length : k - 1;
        if (best.length < k) best.push(null);
        while (j > 0 && best[j - 1].similarity < sim) { best[j] = best[j - 1]; j--; }
        best[j] = { word: this.words[i], similarity: sim, rank: 0 };
      }
    }
    best.forEach((b, i) => { b.rank = i + 1; });
    return best;
  }

  nearest(word, k = 10) {
    const v = this.vector(word);
    if (!v) return null;
    return this.nearestToVector(v, k, [word]);
  }

  // a - b + c  (e.g. king - man + woman). Uses 3CosAdd on unit vectors.
  analogy(a, b, c, k = 10) {
    const va = this.vector(a), vb = this.vector(b), vc = this.vector(c);
    const missing = [[a, va], [b, vb], [c, vc]].filter(([, v]) => !v).map(([w]) => w);
    if (missing.length) return { missing };
    const t = new Float32Array(this.dim);
    for (let d = 0; d < this.dim; d++) t[d] = va[d] - vb[d] + vc[d];
    return { vector: t, results: this.nearestToVector(t, k, [a, b, c]) };
  }

  similarity(a, b) {
    const va = this.vector(a), vb = this.vector(b);
    if (!va || !vb) return null;
    let dot = 0;
    for (let d = 0; d < this.dim; d++) dot += va[d] * vb[d];
    return dot;
  }

  // Autocomplete: prefix matches, most frequent first (vocab is frequency-sorted).
  suggest(prefix, limit = 8) {
    const p = normalize(prefix);
    if (!p) return [];
    const out = [];
    for (let i = 0; i < this.size && out.length < limit; i++) if (this.words[i].startsWith(p)) out.push(this.words[i]);
    return out;
  }

  // Closest spelling in the vocabulary, for "did you mean" when a word is missing.
  closestSpelling(word) {
    const w = normalize(word);
    let best = null, bestD = Infinity;
    const lim = Math.min(this.size, 15000);
    for (let i = 0; i < lim; i++) {
      const c = this.words[i];
      if (Math.abs(c.length - w.length) > 2) continue;
      const d = levenshtein(w, c, bestD);
      if (d < bestD) { bestD = d; best = c; if (d === 1) break; }
    }
    return bestD <= 2 ? best : null;
  }
}

export function normalize(w) { return (w || '').trim().toLowerCase(); }

function levenshtein(a, b, cap) {
  const m = a.length, n = b.length;
  let prev = new Array(n + 1), cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i; let rowMin = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin >= cap) return cap;
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}
