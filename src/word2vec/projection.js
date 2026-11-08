// PCA projection of a small set of word vectors down to 3 dimensions.
// Computed on the points being shown, so the axes capture how *these* words differ.

export function pca(vectors, k = 3) {
  const n = vectors.length;
  if (!n) return { coords: [], explained: [] };
  const dim = vectors[0].length;

  // centre
  const mean = new Float64Array(dim);
  vectors.forEach((v) => { for (let d = 0; d < dim; d++) mean[d] += v[d] / n; });
  const X = vectors.map((v) => { const r = new Float64Array(dim); for (let d = 0; d < dim; d++) r[d] = v[d] - mean[d]; return r; });

  // covariance (dim x dim)
  const C = Array.from({ length: dim }, () => new Float64Array(dim));
  X.forEach((r) => {
    for (let i = 0; i < dim; i++) { const ri = r[i]; if (!ri) continue; const Ci = C[i]; for (let j = i; j < dim; j++) Ci[j] += ri * r[j]; }
  });
  let total = 0;
  for (let i = 0; i < dim; i++) { for (let j = i; j < dim; j++) { C[i][j] /= Math.max(1, n - 1); C[j][i] = C[i][j]; } total += C[i][i]; }

  // top-k eigenvectors by power iteration with deflation (deterministic start)
  const comps = [], vals = [];
  for (let c = 0; c < Math.min(k, dim); c++) {
    let v = new Float64Array(dim);
    for (let d = 0; d < dim; d++) v[d] = Math.sin(d * 12.9898 + c * 78.233) + 1e-3;
    let lambda = 0;
    for (let it = 0; it < 300; it++) {
      const w = new Float64Array(dim);
      for (let i = 0; i < dim; i++) { let s = 0; const Ci = C[i]; for (let j = 0; j < dim; j++) s += Ci[j] * v[j]; w[i] = s; }
      comps.forEach((u) => { let p = 0; for (let d = 0; d < dim; d++) p += w[d] * u[d]; for (let d = 0; d < dim; d++) w[d] -= p * u[d]; });
      let norm = 0; for (let d = 0; d < dim; d++) norm += w[d] * w[d]; norm = Math.sqrt(norm);
      if (norm < 1e-12) break;
      let delta = 0;
      for (let d = 0; d < dim; d++) { const nv = w[d] / norm; delta += Math.abs(nv - v[d]); v[d] = nv; }
      lambda = norm;
      if (delta < 1e-9) break;
    }
    // sign convention: largest-magnitude component positive (stable axes between queries)
    let maxI = 0; for (let d = 1; d < dim; d++) if (Math.abs(v[d]) > Math.abs(v[maxI])) maxI = d;
    if (v[maxI] < 0) for (let d = 0; d < dim; d++) v[d] = -v[d];
    comps.push(v); vals.push(lambda);
  }
  while (comps.length < k) { comps.push(new Float64Array(dim)); vals.push(0); }

  const raw = X.map((r) => comps.map((u) => { let s = 0; for (let d = 0; d < dim; d++) s += r[d] * u[d]; return s; }));
  // scale every axis by the same factor so relative distances stay honest
  let maxAbs = 0; raw.forEach((p) => p.forEach((x) => { if (Math.abs(x) > maxAbs) maxAbs = Math.abs(x); }));
  const coords = raw.map((p) => p.map((x) => (maxAbs ? x / maxAbs : 0)));
  const explained = vals.map((l) => (total ? l / total : 0));
  return { coords, explained };
}
