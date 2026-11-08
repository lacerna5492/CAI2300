import React, { useEffect, useMemo, useRef, useState } from 'react';

const PAD = { top: 28, right: 28, bottom: 40, left: 44 };

function useWidth(ref) {
  const [w, setW] = useState(800);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setW(Math.max(260, Math.round(el.getBoundingClientRect().width)));
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on));
  }, []);
  return reduced;
}

function niceTicks(min, max) {
  const span = max - min || 1;
  const raw = span / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= 6) || raw;
  const ticks = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) ticks.push(+t.toFixed(6));
  return ticks;
}

export default function Scatter2D({ points = [], groups = [], links = [], dark = false, onPick, axisLabels = [] }) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const height = width < 600 ? 380 : 520;
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(null);

  const layout = useMemo(() => {
    if (!points.length) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach((p) => {
      minX = Math.min(minX, p.coords[0]); maxX = Math.max(maxX, p.coords[0]);
      minY = Math.min(minY, p.coords[1]); maxY = Math.max(maxY, p.coords[1]);
    });
    // include 0 so the axes are visible, and pad the range a little
    minX = Math.min(minX, 0); maxX = Math.max(maxX, 0); minY = Math.min(minY, 0); maxY = Math.max(maxY, 0);
    const px = (maxX - minX || 1) * 0.08, py = (maxY - minY || 1) * 0.08;
    minX -= px; maxX += px; minY -= py; maxY += py;
    const iw = width - PAD.left - PAD.right, ih = height - PAD.top - PAD.bottom;
    const sx = (v) => PAD.left + ((v - minX) / (maxX - minX)) * iw;
    const sy = (v) => PAD.top + (1 - (v - minY) / (maxY - minY)) * ih;

    const pos = points.map((p) => ({ x: sx(p.coords[0]), y: sy(p.coords[1]) }));

    // labels: right of the point (left if near the edge), then greedy vertical de-overlap
    const boxes = [];
    const labels = new Array(points.length);
    const order = points.map((_, i) => i).sort((a, b) => (points[b].isQuery - points[a].isQuery) || pos[a].y - pos[b].y);
    order.forEach((i) => {
      const p = points[i];
      const fs = p.isQuery ? 13 : 12;
      const w = p.word.length * (p.isQuery ? 7.9 : 6.9) + 2;
      const r = p.isQuery ? 9 : 5;
      let anchor = 'start';
      let lx = pos[i].x + r + 5;
      if (lx + w > width - 4) { anchor = 'end'; lx = pos[i].x - r - 5; }
      const left = anchor === 'start' ? lx : lx - w;
      let ly = pos[i].y + 4;
      const collides = (y) => boxes.some((b) => left < b.x2 && left + w > b.x1 && y - fs + 2 < b.y2 && y + 3 > b.y1);
      if (collides(ly)) {
        for (let k = 1; k <= 8; k++) {
          const down = pos[i].y + 4 + k * (fs + 1), up = pos[i].y + 4 - k * (fs + 1);
          if (!collides(down) && down < height - 6) { ly = down; break; }
          if (!collides(up) && up > fs) { ly = up; break; }
        }
      }
      boxes.push({ x1: left, x2: left + w, y1: ly - fs + 2, y2: ly + 3 });
      labels[i] = { x: lx, y: ly, anchor, fs };
    });

    return {
      pos, labels, sx, sy,
      xTicks: niceTicks(minX, maxX), yTicks: niceTicks(minY, maxY),
      x0: sx(0), y0: sy(0), minX, maxX, minY, maxY,
    };
  }, [points, width, height]);

  const groupColor = (g) => (groups[g] && groups[g].color) || 'var(--cm-accent)';
  const transition = reduced ? 'none' : 'transform 600ms cubic-bezier(0.22,1,0.36,1)';
  const ring = dark ? '#0B0B0F' : '#FFFFFF';

  const card = {
    position: 'relative', width: '100%', background: 'var(--cm-surface)', border: '1px solid var(--cm-border)',
    borderRadius: 16, overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', color: 'var(--cm-ink)',
  };

  const hp = hover != null ? points[hover] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {groups.length > 0 && (
        <ul aria-label="Legend" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
          {groups.map((g, i) => (
            <li key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--cm-ink)', fontWeight: 500 }}>
              <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 9999, background: g.color, display: 'inline-block' }} />
              {g.word}
            </li>
          ))}
        </ul>
      )}
      <div ref={wrapRef} style={{ ...card, height }}>
        {!layout ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cm-slate)', fontSize: 15 }}>
            Search a word to see it here.
          </div>
        ) : (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="2D projection of word vectors" style={{ display: 'block' }}>
            {/* grid */}
            <g aria-hidden="true">
              {layout.xTicks.map((t) => (
                <g key={'x' + t}>
                  <line x1={layout.sx(t)} x2={layout.sx(t)} y1={PAD.top} y2={height - PAD.bottom} stroke="var(--cm-border)" strokeOpacity={0.6} />
                  <text x={layout.sx(t)} y={height - PAD.bottom + 16} textAnchor="middle" fontSize={11} fill="var(--cm-slate)">{t}</text>
                </g>
              ))}
              {layout.yTicks.map((t) => (
                <g key={'y' + t}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={layout.sy(t)} y2={layout.sy(t)} stroke="var(--cm-border)" strokeOpacity={0.6} />
                  <text x={PAD.left - 8} y={layout.sy(t) + 4} textAnchor="end" fontSize={11} fill="var(--cm-slate)">{t}</text>
                </g>
              ))}
              <line x1={layout.x0} x2={layout.x0} y1={PAD.top} y2={height - PAD.bottom} stroke="var(--cm-slate)" strokeOpacity={0.55} />
              <line x1={PAD.left} x2={width - PAD.right} y1={layout.y0} y2={layout.y0} stroke="var(--cm-slate)" strokeOpacity={0.55} />
              {axisLabels[0] && (
                <text x={width - PAD.right} y={height - 8} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--cm-slate)">{axisLabels[0]}</text>
              )}
              {axisLabels[1] && (
                <text x={14} y={PAD.top} transform={`rotate(-90 14 ${PAD.top})`} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--cm-slate)">{axisLabels[1]}</text>
              )}
            </g>

            {/* links */}
            <g aria-hidden="true">
              {links.map(([a, b], i) => (layout.pos[a] && layout.pos[b] ? (
                <line key={i} x1={layout.pos[a].x} y1={layout.pos[a].y} x2={layout.pos[b].x} y2={layout.pos[b].y}
                  stroke={groupColor(points[b].group)} strokeOpacity={0.35} strokeWidth={1.25} />
              ) : null))}
            </g>

            {/* points: neighbours first, queries on top */}
            {points.map((p, i) => ({ p, i })).sort((a, b) => a.p.isQuery - b.p.isQuery).map(({ p, i }) => {
              const r = (p.isQuery ? 9 : 5) * (hover === i ? 1.5 : 1);
              const q = groups[p.group] ? groups[p.group].word : '';
              const label = p.isQuery ? `${p.word}, search word` : `${p.word}, similarity ${p.similarity != null ? p.similarity.toFixed(3) : 'n/a'} to ${q}`;
              return (
                <g key={p.id} tabIndex={0} role="button" aria-label={label}
                  style={{ transform: `translate(${layout.pos[i].x}px, ${layout.pos[i].y}px)`, transition, cursor: onPick ? 'pointer' : 'default', outline: 'none' }}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                  onFocus={() => setHover(i)} onBlur={() => setHover((h) => (h === i ? null : h))}
                  onClick={() => onPick && onPick(p.word)}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onPick) { e.preventDefault(); onPick(p.word); } }}>
                  <circle r={r} fill={groupColor(p.group)} stroke={p.isQuery ? ring : 'none'} strokeWidth={p.isQuery ? 2.5 : 0}
                    style={{ transition: reduced ? 'none' : 'r 150ms ease' }} />
                  {hover === i && <circle r={r + 5} fill="none" stroke={groupColor(p.group)} strokeOpacity={0.5} strokeWidth={2} />}
                </g>
              );
            })}

            {/* labels */}
            <g aria-hidden="true" style={{ pointerEvents: 'none' }}>
              {points.map((p, i) => {
                const l = layout.labels[i];
                return (
                  <text key={p.id} x={l.x} y={l.y} textAnchor={l.anchor} fontSize={l.fs} fontWeight={p.isQuery ? 700 : 500}
                    fill="var(--cm-ink)" stroke="var(--cm-surface)" strokeWidth={3.5} strokeLinejoin="round"
                    style={{ paintOrder: 'stroke', transition: reduced ? 'none' : 'x 600ms ease, y 600ms ease' }}>
                    {p.word}
                  </text>
                );
              })}
            </g>
          </svg>
        )}

        {hp && layout && (
          <div role="tooltip" style={{
            position: 'absolute', pointerEvents: 'none', zIndex: 2,
            left: Math.min(Math.max(layout.pos[hover].x + 14, 8), width - 200),
            top: Math.max(layout.pos[hover].y - 64, 8),
            background: 'var(--cm-bg)', border: '1px solid var(--cm-border)', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(43,30,63,0.15)', padding: '8px 12px', fontSize: 13, lineHeight: 1.45, minWidth: 150,
          }}>
            <div style={{ fontWeight: 700, color: 'var(--cm-ink)' }}>{hp.word}</div>
            <div style={{ color: 'var(--cm-slate)' }}>
              {hp.isQuery ? 'Search word' : <>Near <b style={{ color: groupColor(hp.group) }}>{groups[hp.group] ? groups[hp.group].word : ''}</b></>}
            </div>
            {!hp.isQuery && hp.similarity != null && (
              <div style={{ color: 'var(--cm-ink)' }}>Cosine similarity: <b>{hp.similarity.toFixed(3)}</b></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
