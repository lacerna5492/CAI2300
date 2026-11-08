// Clothing photos from the design export. Drop the original files into
// src/assets/photos/ (same file names) and they are picked up automatically;
// any photo that is missing falls back to the item's SVG silhouette.
const files = import.meta.glob('./assets/photos/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });

const byName = {};
Object.keys(files).forEach((p) => { byName[p.split('/').pop()] = files[p]; });

export function photo(name) { return byName[name] || ''; }

export function pick(map) {
  const out = {};
  Object.keys(map).forEach((k) => { if (map[k]) out[k] = map[k]; });
  return out;
}
