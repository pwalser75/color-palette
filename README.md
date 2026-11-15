# idx Color Palette Generator

A browser-only color palette generator built around the OKLCH color model. Pick a hue and chroma, tune the lightness anchors at shades 50, 500 and 900, and get a ten-step palette with a live preview.

## Features

- OKLCH-based palettes with sRGB gamut mapping.
- Live preview of shades 50–900, with copy-to-clipboard hex values.
- Adjustable hue, chroma at shade 500, and lightness anchors for shades 50, 500 and 900.
- Hidden hue drift and a chroma taper reproduce the Tailwind-like ramp between the anchors.
- Save, edit, delete, and drag-and-drop reorder palettes.
- Palettes persist in `localStorage`.
- The palette collection is also encoded in the page URL for sharing.
- Light and dark themes, with the selected theme persisted.
- Compact mobile layout: editor and preview fit small screens, and all shades stay on one line without horizontal scrolling.
- Restore default palettes from the empty state.

## Tech stack

- [React](https://react.dev/) and TypeScript
- [Vite](https://vite.dev/)
- [culori](https://culorijs.org/) for OKLCH → sRGB conversion
- [Vitest](https://vitest.dev/) for unit tests
- ESLint for linting

## Getting started

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and build the production bundle. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run the unit tests once. |
| `npm run typecheck` | Run the TypeScript compiler without emitting files. |

## Distribution

`npm run build` produces a single self-contained `dist/index.html` with the CSS, JavaScript, and favicon inlined. It can be:

- opened directly in a browser via `file://`, or
- copied to any web server and served from any URL path.

The page URL is kept in sync with the palette set on save, delete, and reorder, including when the app runs from `file://`. Opening a bookmarked URL restores that palette set.

## Usage

1. Enter a name for the palette.
2. Adjust Hue and Chroma, then shape the ramp with the Lightest shade, Shade 500, and Darkest shade controls.
3. Click any swatch to copy its hex value.
4. Save the palette to add it to the collection below.
5. Edit, delete, or drag palettes to reorder them.

Sharing the current page URL carries the saved palette list to whoever opens the link. The URL payload is compact CSV (`hue,chroma,lightest,middle,darkest,name`, one palette per line) encoded as URL-safe base64.

## Project structure

```text
src/
  App.tsx                 Application shell and palette actions
  components/             Editor, preview, list, dialogs, and controls
  lib/
    color.ts              OKLCH/gamut logic and swatch generation
    defaultPalettes.ts    Seeded built-in palettes
    palette.ts            Palette identity, validation, and ordering
    storage.ts            localStorage and URL persistence
  main.tsx                React entry point
  styles.css              Application styles, including responsive layout
  types.ts                Shared TypeScript types
reference/                Palette reference material
dist/                     Production build output
```

## Notes

- All data stays in the browser. There is no backend.
- Palettes are matched by trimmed, case-insensitive name; saving with an existing name updates it.
- Out-of-gamut colors lose chroma until they are displayable in sRGB, preserving hue and lightness.
