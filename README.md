# ClosetMuse — landing page

Marketing site for ClosetMuse, the AI personal stylist. Built with **React 18 + Vite** and deployed on **Netlify**.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Deploy (Netlify)

`netlify.toml` already configures everything: build command `npm run build`, publish directory `dist`, Node 20.
Connect this repo in Netlify ("Add new site → Import an existing project") and pick the `main` branch.

## Project layout

| Path | What it is |
| --- | --- |
| `src/App.jsx` | The whole page: state, interactive stylist demo, closet calculator, pricing toggle, FAQ, trial modal |
| `src/styles.css` | Design tokens (light/dark themes) and component styles from the design |
| `src/responsive.css` | Tablet and phone layout adjustments |
| `src/photos.js` | Loads clothing photos from `src/assets/photos/` |
| `public/` | Static files (favicon) |

## Word2Vec lab (`/word2vec/`)

An NLP-class page, linked from the landing page nav and footer, for exploring a Word2Vec model in the browser:

- **10 closest words** to any word by cosine similarity (compare up to 4 words at once; autocomplete and "did you mean" for misspellings)
- **Analogies** such as husband − man + woman → wife
- **2D and 3D visualizations** of the neighbourhood using PCA (3D is drag-to-rotate, built with three.js)

The model is skip-gram Word2Vec (gensim, 100 dimensions, window 5, 15 epochs) trained on ~8.2M tokens from NLTK corpora
(Brown, Reuters, Gutenberg, Europarl English, ABC, movie reviews and more). The 25,000 most frequent words ship as int8
vectors (~3 MB) in `public/word2vec/`. To retrain:

```bash
pip install gensim numpy
python3 scripts/train_word2vec.py
```

| Path | What it is |
| --- | --- |
| `word2vec/index.html` | Page entry |
| `src/word2vec/Explorer.jsx` | Search, analogy and results UI |
| `src/word2vec/model.js` | Loads the vectors; nearest-neighbour and analogy search |
| `src/word2vec/projection.js` | PCA to 2D/3D |
| `src/word2vec/Scatter2D.jsx`, `Scatter3D.jsx` | The two visualizations |
| `scripts/train_word2vec.py` | Training and export script |

## Clothing photos

The design refers to product photos by file name (e.g. `d878a16bd196342ee20e8793ac747be5.webp`).
Those files were not part of the export, so every item currently shows its drawn SVG silhouette.
Drop the original image files into `src/assets/photos/` with the same names and they are used automatically.
