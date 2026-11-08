// Turns an inline CSS string ("color: red; gap: 8px") into a React style object.
const cache = new Map();

export function css(str) {
  if (cache.has(str)) return cache.get(str);
  const out = {};
  str.split(';').forEach((decl) => {
    const i = decl.indexOf(':');
    if (i < 0) return;
    const k = decl.slice(0, i).trim();
    if (!k) return;
    const key = k.startsWith('--') ? k : k.replace(/^-(webkit|moz|ms)-/, (_, p) => p.charAt(0).toUpperCase() + p.slice(1) + '-').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = decl.slice(i + 1).trim();
  });
  cache.set(str, out);
  return out;
}
