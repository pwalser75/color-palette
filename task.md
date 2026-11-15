# Color Palette Generator

I want you to create a color palette generator web application (without backend) which allows me 
to create beautiful color palettes which I can use for mobile/web/desktop applications and display/print documents.

The palette generator is based on the OKLCH color model, where the Hue and Chroma drive the main color, and a palette 
of different shade values (50,100,200,300,400,500,600,700,800,900) are generated based on the Hue and Chroma, with 50 being the lightest 
(almost white, but still distinguishable) and 900 being the darkest (almost black, but still distinguishable). The values 0 would be white, and 1000 would be black.

## Description of the UI

Title: "idx Color Palette Generator"
Description: create a description, one paragraph, telling the user about the app and how to use it.

Palette editor:
- Text field for the color name
- Slider and text input for the Hue value, from 0° to 360°
- Slider and text input for the Chroma value
- Sliders and text inputs for the Lightest shade (shade 50), Shade 500 (primary ramp control) and Darkest shade (shade 900)

Preview:
Generated palette, updated in realtime. Lightness is interpolated monotonically through the shade 50, 500 and 900 anchors, while hidden hue drift and chroma taper shape the remaining shades.
Horizontally distributed boxes with each color value, with a text underneath with the shade number, lightness value and the RGB hex color.
It should look like the `references/screenshot.png`.

Actions: Save to add it to the palettes (would overwrite an existing entry with the same name).
A palette is stored with the name, hue, chroma, lightest shade, shade 500 lightness and darkest shade values.
Palettes are stored in the local storage, and loaded on start.

Palettes: List of palettes, like the `references/screenshot.png`.
- Name of the palette
- Values of the Hue, Chroma, Lightest, Shade 500 and Darkest
- Shades with color, like in the preview.
- Actions: Edit (opens a copy of it in the palette editor), Delete (removes it from the list).
- The items in the list can be reordered with drag&drop.

The UI itself has a very modern and timeless elegant look, and spots a dark and light mode which can be switched. Light mode is the default, 
and the selected mode is also stored in the local preferences.

# Storage

The list of palettes and their values are encoded as a base64 query parameter, which is updated when the palettes are changed.
Opening the page with the query parameter would restore the list of palettes.

# Distribution

The build should pack the web application, so I can copy it onto a web server and have it accessible by a URL.

# References

You may look at the files in the `reference` folder to get some ideas.

# Implementation Decisions

## Stack & Tooling
- npm, Vite, React, TypeScript.
- culori for OKLCH → sRGB conversion and gamut handling.
- Vitest for unit tests, ESLint for linting.
- Vite `base: './'` and `vite-plugin-singlefile` so the build works from any URL path or directly via `file://`.

## Color Model
- Shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900.
- Shade coordinate t = i / 9 for i = 0..9.
- Lightness: monotone PCHIP through the shade 50, 500 and 900 anchors, so L(t) always passes through lightest, middle and darkest.
- Lightest shade range: 0.90–0.99 (default 0.97). Middle range: 0.08–0.99, clamped between the endpoints (default 0.55). Darkest range: 0.08–0.80 (default 0.22), allowing bright palettes to keep a lighter 900 shade like the reference.
- Hue uses a hidden quadratic drift: h(t) = h500 + k1·u + k2·u², with u = t − 5/9. The coefficients are stored per reference hue anchor and interpolated by base hue.
- Chroma is interpreted as the chroma of shade 500 and tapers toward both ends using the normalized profile [0.1345, 0.3392, 0.5573, 0.7615, 0.9001, 1.000, 0.960, 0.9117, 0.867, 0.8148].
- Out-of-gamut colors reduce chroma until displayable in sRGB, preserving hue and lightness.
- Swatch labels show shade number, lightness as a percentage, and RGB hex.

## UI & Interaction
- Light mode is the default; theme persists in localStorage.
- Editor defaults: hue 220°, chroma 0.12, lightest 0.97, middle 0.55, darkest 0.22.
- Chroma slider range: 0–0.4. Lightest range: 0.90–0.99. Middle range: 0.08–0.99. Darkest range: 0.08–0.80.
- Each slider has a label, a compact range hint and a hover/focus tooltip explaining what the control does.
- First visit without a URL query parameter or stored palette state is seeded with the built-in default palettes.
- After an explicit Remove all, the empty palette list is persisted and is not re-seeded.
- Palette names are trimmed and matched case-insensitively; empty names are rejected.
- Edit keeps palette identity: saving with the same name updates it, renaming creates a new entry.
- Palette list supports drag-and-drop reordering with mouse and touch.
- Remove all clears the entire list after confirmation, allowing an empty starting set.
- The empty state offers a Restore default palettes action.
- On small screens (≤600px) the intro copy and "Create a palette" heading are hidden and spacing, type and controls are compacted so the editor and preview stay visible with minimal scrolling.
- On small screens Hue and Chroma each take a full row, while Lightest, Shade 500 and Darkest share a single three-column row.
- On small screens the swatch strip stays on one line in a ten-column grid without horizontal scrolling; only the shade number is shown, with lightness and RGB hex hidden.
- On screens ≤720px the palette Edit and Delete actions are icon-only, remain in the top-right of each palette card, and keep a 44×44px touch target.
- Clicking any swatch copies its hex value to the clipboard and shows a toast.

## Storage & URL
- Palettes and theme persist in localStorage.
- Palettes are encoded as URL-safe base64 of compact CSV lines in a query parameter: `hue,chroma,lightest,middle,darkest,name`, one palette per line.
- Legacy JSON URL payloads are still decoded: seven-value tuples with lightCurve/darkCurve, six-value tuples/objects with curve, and four-value tuples/objects with gamma are migrated by computing the shade-500 lightness from the old model.
- Legacy four-value tuples use the default lightest and darkest endpoints when migrating.
- The query parameter updates on save, delete, and reorder, including when the app runs from `file://`, so the current palette set can be bookmarked locally.
- Opening a URL with a `palettes` query parameter restores that palette set, including an explicitly empty set.
- Legacy empty stored lists without the initialization marker are re-seeded with the default palettes; explicit empty lists saved afterwards are preserved.
- On load, a valid URL query parameter wins over localStorage; otherwise stored palettes are used; only when neither exists are the default palettes seeded.
- Malformed URL or localStorage data falls back gracefully.
- Default palettes are a built-in set of 16 palettes with hue, shade-500 chroma and lightness anchors at 50, 500 and 900; hidden hue and chroma profiles supply the remaining shades.

## Distribution
- `npm run build` produces a single self-contained `dist/index.html` with CSS, JS and the favicon inlined.
- The same file can be opened directly in a browser via `file://` or copied to a web server.
- Verification: lint, unit tests, production build, local `file://` check, and manual browser check.
