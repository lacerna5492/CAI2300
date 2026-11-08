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

## Clothing photos

The design refers to product photos by file name (e.g. `d878a16bd196342ee20e8793ac747be5.webp`).
Those files were not part of the export, so every item currently shows its drawn SVG silhouette.
Drop the original image files into `src/assets/photos/` with the same names and they are used automatically.
