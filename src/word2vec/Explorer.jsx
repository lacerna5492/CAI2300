import React, { useEffect, useMemo, useRef, useState } from 'react';
import { loadModel, normalize } from './model.js';
import { pca } from './projection.js';
import Scatter2D from './Scatter2D.jsx';
import Scatter3D from './Scatter3D.jsx';

const LIGHT = ['#5B3A70', '#E07A5F', '#2B6CB0', '#23774F'];
const DARK = ['#C9A6E0', '#F2B880', '#8DB8EA', '#5FC48F'];
const MAX_QUERIES = 4;
const EXAMPLES = ['france', 'doctor', 'computer', 'music', 'car', 'oil', 'monday', 'king'];
const COMPARE = ['france, monday, music', 'car, dog, coffee', 'doctor, computer, oil'];
const ANALOGIES = [['husband', 'man', 'woman'], ['london', 'england', 'france'], ['walked', 'walk', 'swim'], ['better', 'good', 'bad'], ['actor', 'man', 'woman'], ['king', 'man', 'woman']];

function initialTheme() {
  try {
    const saved = window.localStorage.getItem('cm-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch (e) { /* ignore */ }
  return 'light';
}

function parseWords(text) {
  return Array.from(new Set(text.split(/[,\s]+/).map(normalize).filter(Boolean))).slice(0, MAX_QUERIES);
}

function initialQuery() {
  try {
    const p = new URLSearchParams(window.location.search);
    return p.get('q') || 'france, music, car';
  } catch (e) { return 'france, music, car'; }
}

function fmt(n) { return Number(n).toLocaleString('en-US'); }

export default function Explorer() {
  const [theme, setTheme] = useState(initialTheme);
  const [model, setModel] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [mode, setMode] = useState('nearest');
  const [text, setText] = useState(initialQuery);
  const [queries, setQueries] = useState([]);
  const [results, setResults] = useState([]); // [{ query, neighbors }]
  const [notFound, setNotFound] = useState([]); // [{ word, suggestion }]
  const [ana, setAna] = useState(['husband', 'man', 'woman']);
  const [anaResult, setAnaResult] = useState(null);
  const [view, setView] = useState('3d');
  const [suggestions, setSuggestions] = useState([]);
  const [activeSug, setActiveSug] = useState(-1);
  const inputRef = useRef(null);
  const dark = theme === 'dark';
  const palette = dark ? DARK : LIGHT;

  useEffect(() => {
    let alive = true;
    loadModel().then((m) => { if (alive) setModel(m); }).catch((e) => { if (alive) setLoadError(e.message || 'Failed to load the model.'); });
    return () => { alive = false; };
  }, []);

  // run the initial query once the model is ready
  useEffect(() => { if (model) runNearest(text); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [model]);

  useEffect(() => { document.body.style.background = dark ? '#0B0B0F' : '#FBF7F2'; }, [dark]);

  function toggleTheme() {
    const nt = dark ? 'light' : 'dark';
    try { window.localStorage.setItem('cm-theme', nt); } catch (e) { /* ignore */ }
    setTheme(nt);
  }

  function runNearest(raw) {
    if (!model) return;
    const words = parseWords(raw);
    const found = [], missing = [];
    words.forEach((w) => {
      const n = model.nearest(w, 10);
      if (n) found.push({ query: w, neighbors: n });
      else missing.push({ word: w, suggestion: model.closestSpelling(w) });
    });
    setMode('nearest');
    setQueries(found.map((f) => f.query));
    setResults(found);
    setNotFound(missing);
    setSuggestions([]);
    try {
      const url = new URL(window.location.href);
      if (found.length) url.searchParams.set('q', found.map((f) => f.query).join(','));
      window.history.replaceState(null, '', url);
    } catch (e) { /* ignore */ }
  }

  function runAnalogy(triple) {
    if (!model) return;
    const [a, b, c] = triple.map(normalize);
    const r = model.analogy(a, b, c, 10);
    setMode('analogy');
    setAnaResult({ a, b, c, ...r, missingInfo: (r.missing || []).map((w) => ({ word: w, suggestion: model.closestSpelling(w) })) });
  }

  function onSubmit(e) { e.preventDefault(); runNearest(text); }

  function pick(word) {
    setText(word);
    runNearest(word);
    const el = document.getElementById('w2v-results');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onInput(e) {
    const v = e.target.value;
    setText(v);
    if (!model) return;
    const last = v.split(/[,\s]+/).pop();
    setSuggestions(last && last.length >= 1 ? model.suggest(last, 8) : []);
    setActiveSug(-1);
  }

  function applySuggestion(s) {
    const parts = text.split(/([,\s]+)/);
    parts[parts.length - 1] = s;
    const nt = parts.join('');
    setText(nt);
    setSuggestions([]);
    inputRef.current && inputRef.current.focus();
  }

  function onKeyDown(e) {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSug((i) => (i + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSug((i) => (i <= 0 ? suggestions.length - 1 : i - 1)); }
    else if (e.key === 'Enter' && activeSug >= 0) { e.preventDefault(); applySuggestion(suggestions[activeSug]); }
    else if (e.key === 'Escape') setSuggestions([]);
  }

  // ---------- visualization data ----------
  const viz = useMemo(() => {
    if (!model) return null;
    const pts = [], vecs = [], links = [], groups = [];
    if (mode === 'nearest') {
      results.forEach((r, g) => {
        groups.push({ word: r.query, color: palette[g % palette.length] });
        const qi = pts.length;
        pts.push({ id: `${g}|${r.query}`, word: r.query, group: g, isQuery: true, similarity: null });
        vecs.push(model.vector(r.query));
        r.neighbors.forEach((n) => {
          links.push([qi, pts.length]);
          pts.push({ id: `${g}|${n.word}`, word: n.word, group: g, isQuery: false, similarity: n.similarity });
          vecs.push(model.vector(n.word));
        });
      });
    } else if (anaResult && anaResult.results) {
      const label = `${anaResult.a} − ${anaResult.b} + ${anaResult.c}`;
      groups.push({ word: label, color: palette[0] });
      groups.push({ word: 'input words', color: dark ? '#D3C6B6' : '#5F6371' });
      pts.push({ id: 'target', word: label, group: 0, isQuery: true, similarity: null });
      { // unit-normalise the A − B + C vector so it lives on the same sphere as the words
        const t = anaResult.vector; let nn = 0; for (let d = 0; d < t.length; d++) nn += t[d] * t[d];
        nn = Math.sqrt(nn) || 1; vecs.push(Array.from(t, (x) => x / nn));
      }
      anaResult.results.forEach((n) => {
        links.push([0, pts.length]);
        pts.push({ id: `r|${n.word}`, word: n.word, group: 0, isQuery: false, similarity: n.similarity });
        vecs.push(model.vector(n.word));
      });
      [anaResult.a, anaResult.b, anaResult.c].forEach((w) => {
        const v = model.vector(w);
        let dot = 0, nt = 0;
        for (let d = 0; d < v.length; d++) { dot += v[d] * anaResult.vector[d]; nt += anaResult.vector[d] ** 2; }
        pts.push({ id: `in|${w}`, word: w, group: 1, isQuery: false, similarity: dot / Math.sqrt(nt || 1) });
        vecs.push(v);
      });
    }
    const { coords, explained } = pca(vecs, 3);
    pts.forEach((p, i) => { p.coords = coords[i] || [0, 0, 0]; });
    const axisLabels = explained.map((e, i) => `PC${i + 1} (${Math.round(e * 100)}%)`);
    return { points: pts, links, groups, axisLabels, explained };
  }, [model, mode, results, anaResult, palette, dark]);

  const meta = (model && model.meta) || {};

  return (
    <div className={`cm-root ${dark ? 'cm-dark' : 'cm-light'} w2v`} id="top">
      <a href="#w2v-main" className="cm-skip">Skip to content</a>
      <header className="cm-nav cm-nav-scrolled">
        <div className="cm-container" style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <a href="/" aria-label="ClosetMuse home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--cm-ink)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path d="M7 3h18a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5H15l-7 5v-5H7a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z" fill="#5B3A70" /><path d="M16 9.2a1.7 1.7 0 1 1 1.7 1.7c-.8.3-1.7.8-1.7 1.8v.6M16 13.3l-7.2 4.6h14.4z" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="cm-serif" style={{ fontSize: 24, lineHeight: 1 }}>ClosetMuse</span>
            <span className="cm-badge" style={{ marginLeft: 4 }}>NLP lab</span>
          </a>
          <nav aria-label="Word2Vec" className="w2v-nav" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a className="cm-navlink" href="#w2v-search">Search</a>
            <a className="cm-navlink" href="#w2v-viz">Visualize</a>
            <a className="cm-navlink" href="#w2v-about">How it works</a>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" className="cm-icon-btn" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
              {dark
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0z" /></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21.75 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998z" /></svg>}
            </button>
            <a className="cm-btn-secondary" href="/" style={{ minHeight: 44 }}>Back to site</a>
          </div>
        </div>
      </header>

      <main id="w2v-main">
        <section style={{ position: 'relative', overflow: 'hidden', padding: '72px 0 40px' }}>
          <div className="cm-aurora" aria-hidden="true" />
          <div className="cm-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1280 }}>
            <p className="cm-eyebrow">NLP lab · Word embeddings</p>
            <h1 className="cm-h1" style={{ maxWidth: 820 }}>Word2Vec explorer</h1>
            <p className="cm-h6" style={{ fontWeight: 400, color: 'var(--cm-slate)', maxWidth: 760, lineHeight: 1.6 }}>
              A skip-gram Word2Vec model we trained on ~{meta.tokens ? `${(meta.tokens / 1e6).toFixed(1)}M` : '10M'} words of English text.
              Type a word to see its 10 nearest neighbours by cosine similarity, then explore the neighbourhood in 2D and 3D.
            </p>
            <ul className="w2v-stats" aria-label="Model details">
              {model ? (
                <>
                  <li><b>{fmt(model.size)}</b> words loaded</li>
                  <li><b>{model.dim}</b> dimensions</li>
                  <li><b>{fmt(meta.tokens || 0)}</b> training tokens</li>
                  <li>skip-gram · window {meta.window} · {meta.epochs} epochs</li>
                </>
              ) : <li>{loadError ? 'Model failed to load' : 'Loading model (~3 MB)…'}</li>}
            </ul>
          </div>
        </section>

        {loadError && (
          <div className="cm-container"><p role="alert" className="cm-card" style={{ padding: 24, color: 'var(--cm-error)' }}>{loadError} Try reloading the page.</p></div>
        )}

        <section id="w2v-search" className="cm-section" style={{ paddingTop: 24 }}>
          <div className="cm-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="cm-toggle" role="tablist" aria-label="Query type" style={{ alignSelf: 'flex-start' }}>
              <button type="button" role="tab" className="cm-toggle-btn" aria-selected={mode === 'nearest'} aria-pressed={mode === 'nearest'} onClick={() => { setMode('nearest'); }}>Nearest words</button>
              <button type="button" role="tab" className="cm-toggle-btn" aria-selected={mode === 'analogy'} aria-pressed={mode === 'analogy'} onClick={() => { setMode('analogy'); if (!anaResult) runAnalogy(ana); }}>Analogy</button>
            </div>

            {mode === 'nearest' ? (
              <div className="cm-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} autoComplete="off">
                  <label htmlFor="w2v-input" className="cm-caption" style={{ color: 'var(--cm-ink)' }}>
                    Enter a word, or up to {MAX_QUERIES} words separated by commas to compare them
                  </label>
                  <div className="w2v-searchrow">
                    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                      <input
                        ref={inputRef} id="w2v-input" className="cm-input" value={text} onChange={onInput} onKeyDown={onKeyDown}
                        placeholder="e.g. king   or   france, monday, money" disabled={!model}
                        role="combobox" aria-expanded={suggestions.length > 0} aria-controls="w2v-sug" aria-autocomplete="list"
                        aria-activedescendant={activeSug >= 0 ? `w2v-sug-${activeSug}` : undefined}
                        onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                        spellCheck={false} autoCapitalize="off"
                      />
                      {suggestions.length > 0 && (
                        <ul id="w2v-sug" role="listbox" className="w2v-sug">
                          {suggestions.map((s, i) => (
                            <li key={s} id={`w2v-sug-${i}`} role="option" aria-selected={i === activeSug} className={i === activeSug ? 'on' : ''}
                              onMouseDown={(e) => { e.preventDefault(); applySuggestion(s); }}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button type="submit" className="cm-btn" disabled={!model} style={{ minHeight: 52 }}>Find 10 closest</button>
                  </div>
                </form>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <span className="cm-xsmall cm-muted">Try:</span>
                  {EXAMPLES.map((w) => <button key={w} type="button" className="cm-chip w2v-chip" onClick={() => { setText(w); runNearest(w); }} disabled={!model}>{w}</button>)}
                  {COMPARE.map((w) => <button key={w} type="button" className="cm-chip w2v-chip" onClick={() => { setText(w); runNearest(w); }} disabled={!model}>{w}</button>)}
                </div>
                {notFound.length > 0 && (
                  <p className="cm-small" role="status" style={{ color: 'var(--cm-warning)' }}>
                    {notFound.map((m, i) => (
                      <span key={m.word}>{i > 0 && ' · '}“{m.word}” isn’t in the vocabulary
                        {m.suggestion && <> — did you mean <button type="button" className="cm-why-btn" style={{ minHeight: 0 }} onClick={() => pick(m.suggestion)}>{m.suggestion}</button>?</>}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            ) : (
              <div className="cm-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <form onSubmit={(e) => { e.preventDefault(); runAnalogy(ana); }} className="w2v-analogy" autoComplete="off">
                  {[0, 1, 2].map((i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="w2v-op" aria-hidden="true">{i === 1 ? '−' : '+'}</span>}
                      <label className="cm-sr" htmlFor={`w2v-ana-${i}`}>{['Word A', 'minus word B', 'plus word C'][i]}</label>
                      <input id={`w2v-ana-${i}`} className="cm-input" value={ana[i]} disabled={!model} spellCheck={false} autoCapitalize="off"
                        onChange={(e) => { const n = ana.slice(); n[i] = e.target.value; setAna(n); }} />
                    </React.Fragment>
                  ))}
                  <button type="submit" className="cm-btn" disabled={!model} style={{ minHeight: 52 }}>Solve</button>
                </form>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <span className="cm-xsmall cm-muted">Try:</span>
                  {ANALOGIES.map((t) => (
                    <button key={t.join()} type="button" className="cm-chip w2v-chip" disabled={!model} onClick={() => { setAna(t); runAnalogy(t); }}>{t[0]} − {t[1]} + {t[2]}</button>
                  ))}
                </div>
                <p className="cm-xsmall cm-muted">Vector arithmetic: the answer is the word whose vector is closest to A − B + C (the input words are excluded). A small corpus gets some of these right and some wrong, which is a useful thing to discuss.</p>
                {anaResult && anaResult.missingInfo && anaResult.missingInfo.length > 0 && (
                  <p className="cm-small" role="status" style={{ color: 'var(--cm-warning)' }}>
                    Not in the vocabulary: {anaResult.missingInfo.map((m) => `“${m.word}”${m.suggestion ? ` (did you mean ${m.suggestion}?)` : ''}`).join(', ')}
                  </p>
                )}
              </div>
            )}

            <div id="w2v-results" className="w2v-results" aria-live="polite">
              {mode === 'nearest' && results.map((r, g) => (
                <ResultList key={r.query} title={r.query} color={palette[g % palette.length]} items={r.neighbors} onPick={pick} />
              ))}
              {mode === 'analogy' && anaResult && anaResult.results && (
                <ResultList title={`${anaResult.a} − ${anaResult.b} + ${anaResult.c}`} color={palette[0]} items={anaResult.results} onPick={pick} />
              )}
            </div>
          </div>
        </section>

        <section id="w2v-viz" className="cm-section cm-section-mist">
          <div className="cm-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
                <p className="cm-eyebrow">Visualize</p>
                <h2 className="cm-h2">The neighbourhood, projected</h2>
                <p className="cm-body cm-muted">
                  Each word is a {model ? model.dim : 100}-dimensional vector. We project the words below onto their top principal
                  components (PCA) so you can see them. Click any point to search for that word.
                </p>
              </div>
              <div className="cm-toggle" role="tablist" aria-label="Visualization">
                <button type="button" role="tab" className="cm-toggle-btn" aria-selected={view === '2d'} aria-pressed={view === '2d'} onClick={() => setView('2d')}>2D</button>
                <button type="button" role="tab" className="cm-toggle-btn" aria-selected={view === '3d'} aria-pressed={view === '3d'} onClick={() => setView('3d')}>3D</button>
              </div>
            </div>
            {viz && (
              view === '2d'
                ? <Scatter2D points={viz.points} groups={viz.groups} links={viz.links} dark={dark} onPick={pick} axisLabels={viz.axisLabels.slice(0, 2)} />
                : <Scatter3D points={viz.points} groups={viz.groups} links={viz.links} dark={dark} onPick={pick} axisLabels={viz.axisLabels} />
            )}
            {!viz && <div className="cm-card" style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p className="cm-muted">{loadError ? 'No model loaded.' : 'Loading model…'}</p></div>}
            {viz && viz.points.length > 0 && (
              <p className="cm-xsmall cm-muted">
                {view === '2d' ? 'The 2D view' : 'The 3D view'} keeps {Math.round(viz.explained.slice(0, view === '2d' ? 2 : 3).reduce((a, b) => a + b, 0) * 100)}% of the variance among these {viz.points.length} words.
                Distances in a projection are approximate: the similarity scores in the lists are the exact cosine values.
              </p>
            )}
          </div>
        </section>

        <section id="w2v-about" className="cm-section">
          <div className="cm-container w2v-about">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="cm-eyebrow">How it works</p>
              <h2 className="cm-h2">What you’re looking at</h2>
            </div>
            <div className="w2v-about-grid">
              <article className="cm-card" style={{ padding: 28 }}>
                <h3 className="cm-h5" style={{ fontWeight: 600, marginBottom: 8 }}>1 · Training</h3>
                <p className="cm-small cm-muted">
                  Skip-gram Word2Vec (gensim) with negative sampling: the model learns a vector for each word by predicting the words
                  within ±{meta.window || 5} positions of it. Trained for {meta.epochs || 15} epochs on {fmt(meta.tokens || 0)} tokens from NLTK corpora
                  ({(meta.corpora || []).join(', ').replace(/_/g, ' ')}). Words seen fewer than {meta.minCount || 5} times were dropped.
                </p>
              </article>
              <article className="cm-card" style={{ padding: 28 }}>
                <h3 className="cm-h5" style={{ fontWeight: 600, marginBottom: 8 }}>2 · Similarity</h3>
                <p className="cm-small cm-muted">
                  Closeness is cosine similarity: cos(u, v) = u·v / (‖u‖‖v‖), from −1 to 1. The 10 closest words are the ones with the highest
                  cosine to your word, computed over all {model ? fmt(model.size) : '25,000'} words in your browser.
                </p>
              </article>
              <article className="cm-card" style={{ padding: 28 }}>
                <h3 className="cm-h5" style={{ fontWeight: 600, marginBottom: 8 }}>3 · Projection</h3>
                <p className="cm-small cm-muted">
                  PCA finds the directions of greatest variance among the plotted words. The 2D chart uses the first two components and the
                  3D chart adds the third, so 3D usually keeps more of the structure.
                </p>
              </article>
            </div>
            <p className="cm-xsmall cm-muted">
              To retrain: <code>pip install gensim numpy && python3 scripts/train_word2vec.py</code>. The model ships as int8 vectors (~3 MB) in <code>public/word2vec/</code>.
            </p>
          </div>
        </section>
      </main>

      <footer className="cm-footer" style={{ padding: '40px 0' }}>
        <div className="cm-container" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p className="cm-small">© 2026 ClosetMuse · NLP lab</p>
          <a className="cm-small" href="/">← Back to ClosetMuse</a>
        </div>
      </footer>
    </div>
  );
}

function ResultList({ title, color, items, onPick }) {
  return (
    <article className="cm-card w2v-list" style={{ borderTop: `4px solid ${color}` }}>
      <h3 className="cm-h5" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 999, background: color, flex: 'none' }} />
        <span style={{ overflowWrap: 'anywhere' }}>{title}</span>
      </h3>
      <p className="cm-xsmall cm-muted" style={{ marginTop: 2 }}>10 closest words · cosine similarity</p>
      <ol>
        {items.map((n) => (
          <li key={n.word}>
            <span className="w2v-rank">{n.rank}</span>
            <button type="button" className="w2v-word" onClick={() => onPick(n.word)} title={`Search “${n.word}”`}>{n.word}</button>
            <span className="w2v-bar" aria-hidden="true"><span style={{ width: `${Math.max(0, n.similarity) * 100}%`, background: color }} /></span>
            <span className="w2v-sim">{n.similarity.toFixed(3)}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
