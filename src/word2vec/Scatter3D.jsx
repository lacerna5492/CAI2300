import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// Interactive 3D scatter of word vectors (PCA coords), drawn with three.js.
const SCALE = 5;
const AXIS_LEN = 6;
const CAMERA_HOME = new THREE.Vector3(7.5, 5.5, 9.5);

function prefersReducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
}

function makeLabel(text, opts) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.font = (opts.bold ? '600 ' : '400 ') + (opts.size || 12) + 'px Inter, system-ui, sans-serif';
  el.style.color = opts.color || 'var(--cm-ink)';
  el.style.whiteSpace = 'nowrap';
  el.style.pointerEvents = 'none';
  el.style.userSelect = 'none';
  el.style.textShadow = '0 0 3px var(--cm-surface), 0 0 3px var(--cm-surface), 0 0 6px var(--cm-surface)';
  const obj = new CSS2DObject(el);
  if (opts.offsetY) obj.center.set(0.5, opts.offsetY);
  return obj;
}

function disposeObject(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    }
    if (o.isCSS2DObject && o.element && o.element.parentNode) o.element.parentNode.removeChild(o.element);
  });
}

export default function Scatter3D({ points = [], groups = [], links = [], dark = false, onPick, axisLabels }) {
  const wrapRef = useRef(null);
  const ctx = useRef(null); // three.js state that lives for the component lifetime
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const [rotating, setRotating] = useState(() => !prefersReducedMotion());
  const [tip, setTip] = useState(null);
  const [height, setHeight] = useState(520);

  // ---------- one-time scene setup ----------
  useEffect(() => {
    const wrap = wrapRef.current;
    const width = wrap.clientWidth || 600;
    const h = width < 600 ? 380 : 520;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, h);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';
    wrap.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, h);
    const ld = labelRenderer.domElement;
    ld.style.position = 'absolute';
    ld.style.top = '0';
    ld.style.left = '0';
    ld.style.pointerEvents = 'none';
    wrap.appendChild(ld);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 200);
    camera.position.copy(CAMERA_HOME);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(6, 10, 8);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = !prefersReducedMotion();
    controls.autoRotateSpeed = 0.9;
    controls.minDistance = 3;
    controls.maxDistance = 40;
    controls.target.set(0, 0, 0);

    const content = new THREE.Group(); // points, links, labels (rebuilt on prop change)
    const decor = new THREE.Group();   // axes + grid (rebuilt on theme change)
    scene.add(content);
    scene.add(decor);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const state = { renderer, labelRenderer, scene, camera, controls, content, decor, raycaster, meshes: [], hovered: null, raf: 0 };
    ctx.current = state;

    const pick = (ev) => {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(state.meshes, false)[0];
      return { hit: hit ? hit.object : null, x: ev.clientX - r.left, y: ev.clientY - r.top };
    };

    const onMove = (ev) => {
      const { hit, x, y } = pick(ev);
      if (state.hovered && state.hovered !== hit) state.hovered.scale.setScalar(1);
      state.hovered = hit;
      if (hit) {
        hit.scale.setScalar(1.35);
        renderer.domElement.style.cursor = 'pointer';
        setTip({ x, y, data: hit.userData });
      } else {
        renderer.domElement.style.cursor = 'grab';
        setTip(null);
      }
    };
    const onLeave = () => {
      if (state.hovered) state.hovered.scale.setScalar(1);
      state.hovered = null;
      setTip(null);
    };
    let downAt = null;
    const onDown = (ev) => { downAt = { x: ev.clientX, y: ev.clientY }; };
    const onUp = (ev) => {
      if (!downAt) return;
      const moved = Math.abs(ev.clientX - downAt.x) + Math.abs(ev.clientY - downAt.y);
      downAt = null;
      if (moved > 5) return; // it was a drag, not a click
      const { hit } = pick(ev);
      if (hit && onPickRef.current) onPickRef.current(hit.userData.word);
    };
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerleave', onLeave);
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    const loop = () => {
      state.raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    loop();

    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth;
      if (!w) return;
      const nh = w < 600 ? 380 : 520;
      setHeight(nh);
      renderer.setSize(w, nh);
      labelRenderer.setSize(w, nh);
      camera.aspect = w / nh;
      camera.updateProjectionMatrix();
    });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(state.raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose();
      disposeObject(content);
      disposeObject(decor);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      if (ld.parentNode) ld.parentNode.removeChild(ld);
      ctx.current = null;
    };
  }, []);

  // ---------- axes + grid (theme dependent) ----------
  useEffect(() => {
    const s = ctx.current;
    if (!s) return;
    disposeObject(s.decor);
    s.decor.clear();
    const axisColor = dark ? 0xd3c6b6 : 0x5f6371;
    const gridMain = dark ? 0x3a2a52 : 0xe4ded6;
    const gridSub = dark ? 0x241a33 : 0xefeae4;

    const grid = new THREE.GridHelper(12, 12, gridMain, gridSub);
    grid.position.y = -SCALE * 1.05;
    grid.material.transparent = true;
    grid.material.opacity = 0.7;
    s.decor.add(grid);

    const axes = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
    const labels = axisLabels && axisLabels.length ? axisLabels : ['PC1', 'PC2', 'PC3'];
    axes.forEach((d, i) => {
      const geo = new THREE.BufferGeometry().setFromPoints([d.clone().multiplyScalar(-AXIS_LEN), d.clone().multiplyScalar(AXIS_LEN)]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: axisColor, transparent: true, opacity: 0.35 }));
      s.decor.add(line);
      const lab = makeLabel(labels[i] || '', { size: 11, color: 'var(--cm-slate)' });
      lab.position.copy(d.clone().multiplyScalar(AXIS_LEN + 0.4));
      s.decor.add(lab);
    });
  }, [dark, axisLabels && axisLabels.join('|')]);

  // ---------- points, links, labels ----------
  useEffect(() => {
    const s = ctx.current;
    if (!s) return;
    disposeObject(s.content);
    s.content.clear();
    s.meshes = [];
    s.hovered = null;
    setTip(null);

    const pos = points.map((p) => new THREE.Vector3(p.coords[0] * SCALE, p.coords[1] * SCALE, (p.coords[2] || 0) * SCALE));
    const colorOf = (g) => new THREE.Color((groups[g] && groups[g].color) || '#5B3A70');

    const qGeo = new THREE.SphereGeometry(0.22, 24, 16);
    const nGeo = new THREE.SphereGeometry(0.12, 16, 12);
    points.forEach((p, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: colorOf(p.group), roughness: 0.45, metalness: 0.05 });
      const mesh = new THREE.Mesh(p.isQuery ? qGeo.clone() : nGeo.clone(), mat);
      mesh.position.copy(pos[i]);
      mesh.userData = {
        word: p.word,
        query: (groups[p.group] && groups[p.group].word) || '',
        isQuery: p.isQuery,
        similarity: p.similarity,
      };
      s.content.add(mesh);
      s.meshes.push(mesh);

      const lab = makeLabel(p.word, { bold: p.isQuery, size: p.isQuery ? 13 : 12, offsetY: 1.35 });
      lab.position.copy(pos[i]);
      lab.position.y += p.isQuery ? 0.3 : 0.2;
      s.content.add(lab);
    });
    qGeo.dispose();
    nGeo.dispose();

    // links grouped by colour so each group is one LineSegments object
    const byGroup = new Map();
    links.forEach(([a, b]) => {
      if (!pos[a] || !pos[b]) return;
      const g = points[a].group;
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(pos[a], pos[b]);
    });
    byGroup.forEach((verts, g) => {
      const geo = new THREE.BufferGeometry().setFromPoints(verts);
      const mat = new THREE.LineBasicMaterial({ color: colorOf(g), transparent: true, opacity: 0.45 });
      s.content.add(new THREE.LineSegments(geo, mat));
    });
  }, [points, groups, links]);

  // ---------- rotation toggle ----------
  useEffect(() => { if (ctx.current) ctx.current.controls.autoRotate = rotating; }, [rotating]);

  const resetView = () => {
    const s = ctx.current;
    if (!s) return;
    s.camera.position.copy(CAMERA_HOME);
    s.controls.target.set(0, 0, 0);
    s.controls.update();
  };

  const chipStyle = { minHeight: 34, padding: '0 12px', fontSize: 13, background: 'var(--cm-surface)' };

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative', width: '100%', height, overflow: 'hidden', borderRadius: 16,
        background: 'var(--cm-surface)', border: '1px solid var(--cm-border)', fontFamily: 'Inter, system-ui, sans-serif',
      }}
      role="img"
      aria-label={points.length ? `3D projection of ${points.length} word vectors` : '3D projection (empty)'}
    >
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 3, display: 'flex', gap: 8 }}>
        <button type="button" className="cm-chip" style={chipStyle} onClick={() => setRotating((r) => !r)}>
          {rotating ? 'Pause rotation' : 'Rotate'}
        </button>
        <button type="button" className="cm-chip" style={chipStyle} onClick={resetView}>Reset view</button>
      </div>

      {groups.length > 0 && (
        <ul aria-label="Legend" style={{ position: 'absolute', top: 12, left: 14, zIndex: 3, margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', maxWidth: '55%', pointerEvents: 'none' }}>
          {groups.map((g) => (
            <li key={g.word} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--cm-ink)' }}>
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: g.color }} />{g.word}
            </li>
          ))}
        </ul>
      )}

      {points.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: 'var(--cm-slate)', fontSize: 15 }}>
          Search a word to see it here.
        </div>
      )}

      {tip && (
        <div
          style={{
            position: 'absolute', zIndex: 4, left: Math.min(tip.x + 14, (wrapRef.current ? wrapRef.current.clientWidth : 600) - 190), top: Math.max(tip.y - 12, 8),
            pointerEvents: 'none', padding: '8px 12px', borderRadius: 10, background: 'var(--cm-bg)', color: 'var(--cm-ink)',
            border: '1px solid var(--cm-border)', boxShadow: '0 8px 24px rgba(43,30,63,0.15)', fontSize: 13, lineHeight: 1.45, minWidth: 140,
          }}
        >
          <div style={{ fontWeight: 600 }}>{tip.data.word}</div>
          {tip.data.isQuery ? (
            <div style={{ color: 'var(--cm-slate)' }}>Query word</div>
          ) : (
            <div style={{ color: 'var(--cm-slate)' }}>
              near “{tip.data.query}” · cos {tip.data.similarity != null ? tip.data.similarity.toFixed(3) : '—'}
            </div>
          )}
        </div>
      )}

      <div style={{ position: 'absolute', left: 14, bottom: 10, zIndex: 3, fontSize: 12, color: 'var(--cm-slate)', pointerEvents: 'none' }}>
        Drag to rotate · scroll to zoom
      </div>
    </div>
  );
}
