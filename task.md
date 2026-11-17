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
- Slider and text input for Shade 500 lightness (primary ramp control)
- For the Lightest shade (shade 50): sliders and text inputs for lightness, chroma boost (0–5, factor applied to the base chroma) and hue shift (−45°–45°)
- For the Darkest shade (shade 900): sliders and text inputs for lightness, chroma boost (0–5, factor applied to the base chroma) and hue shift (−45°–45°)

Preview:
Generated palette, updated in realtime. Lightness, chroma and hue are interpolated smoothly through the shade 50, 500 and 900 anchors.
Horizontally distributed boxes with each color value, with a text underneath with the shade number, lightness value and the RGB hex color.
It should look like the `references/screenshot.png`.

Actions: Save to add it to the palettes (would overwrite an existing entry with the same name).
A palette is stored with the name, hue, base chroma, shade 500 lightness, and the lightness, chroma boost and hue shift for the lightest and darkest shades.
Palettes are stored in the local storage, and loaded on start.

Palettes: List of palettes, like the `references/screenshot.png`.
- Name of the palette
- Values of the Hue, Chroma, Shade 500 and the lightness, chroma boost and hue shift of the lightest and darkest shades
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
- Lightness: monotone PCHIP through the shade 50, 500 and 900 anchors, so L(t) always passes through lightest L, shade-500 L and darkest L.
- Chroma: PCHIP through the endpoint anchors `baseChroma × lightestChromaBoost`, `baseChroma` at shade 500 and `baseChroma × darkestChromaBoost`, clamped to non-negative values.
- Hue: PCHIP through `hue + lightestHueShift`, `hue` at shade 500 and `hue + darkestHueShift`, normalized to 0–360°.
- Lightest shade range: 0.90–0.99 (default 0.97). Shade 500 range: 0.08–0.99, clamped between the endpoints (default 0.55). Darkest range: 0.08–0.80 (default 0.22), allowing bright palettes to keep a lighter 900 shade like the reference.
- Endpoint chroma boost range: 0–5 (defaults 0.15 for shade 50 and 0.8 for shade 900). Endpoint hue shift range: −45°–45° (default 0°).
- Out-of-gamut colors reduce chroma until displayable in sRGB, preserving hue and lightness.
- Swatch labels show shade number, lightness as a percentage, and RGB hex.

## UI & Interaction
- Light mode is the default; theme persists in localStorage.
- Editor defaults: hue 220°, chroma 0.12, shade-500 lightness 0.55, lightest 0.97 with chroma boost 0.15 and hue shift 0°, darkest 0.22 with chroma boost 0.8 and hue shift 0°.
- Chroma slider range: 0–0.4. Shade 500 range: 0.08–0.99. Lightest range: 0.90–0.99. Darkest range: 0.08–0.80. Chroma boost range: 0–5. Hue shift range: −45°–45°.
- The editor groups the controls into Base color, Lightest shade · 50 and Darkest shade · 900. Within both shade groups the controls are ordered hue shift, chroma boost, lightness so they line up with the hue, chroma and lightness controls of the base color group.
- Each slider has a label, a compact range hint and a hover/focus tooltip explaining what the control does.
- First visit without a URL query parameter or stored palette state is seeded with the built-in default palettes.
- After an explicit Remove all, the empty palette list is persisted and is not re-seeded.
- Palette names are trimmed and matched case-insensitively; empty names are rejected.
- Edit keeps palette identity: saving with the same name updates it, renaming creates a new entry.
- Palette list supports drag-and-drop reordering with mouse and touch.
- Collection actions include SVG and CSS exports, opened in a new tab via blob URLs.
- The SVG export mirrors the reference sheet: palette name, ten swatches, shade numbers and hex values.
- The CSS export writes `:root` custom properties named `--color-<slug>-<shade>` plus hue, chroma and lightness metadata comments.
- Remove all clears the entire list after confirmation, allowing an empty starting set.
- The empty state offers a Restore default palettes action.
- On small screens (≤600px) the intro copy and "Create a palette" heading are hidden and spacing, type and controls are compacted so the editor and preview stay visible with minimal scrolling.
- On small screens Hue, Chroma and Shade 500 each take a full row, while the three controls of each shade endpoint share a single three-column row.
- On small screens the shade endpoint number inputs are hidden and only their sliders remain, the color name label is dropped in favor of a bold input with a "Color name" placeholder, and the Save palette button keeps its content width instead of stretching.
- On screens ≤720px the swatch strips switch to a ten-column grid so the preview and every palette row are fully visible without horizontal scrolling; on ≤600px only the shade number is shown, with lightness and RGB hex hidden.
- On screens ≤720px the editor number inputs are narrowed and the field gaps reduced so the sliders keep a usable width in the three-column layout.
- On screens ≤720px the palette Edit and Delete actions are icon-only, remain in the top-right of each palette card, and keep a 44×44px touch target.
- The page never scrolls horizontally on small screens; hidden tooltips are removed from layout and horizontal overflow is clipped.
- Clicking any swatch copies its hex value to the clipboard and shows a toast.

## Storage & URL
- Palettes and theme persist in localStorage.
- Palettes are encoded as URL-safe base64 of compact CSV lines in a query parameter: `hue,chroma,shade500,lightest,lightestChromaBoost,lightestHueShift,darkest,darkestChromaBoost,darkestHueShift,name`, one palette per line.
- Legacy five-value CSV lines (`hue,chroma,lightest,middle,darkest,name`) are still decoded; the old middle value becomes shade-500 lightness and the endpoint settings use the defaults.
- Legacy JSON URL payloads are still decoded: seven-value tuples with lightCurve/darkCurve, six-value tuples/objects with curve, and four-value tuples/objects with gamma are migrated by computing the shade-500 lightness from the old model.
- Legacy four-value tuples use the default lightest and darkest endpoints when migrating.
- The query parameter updates on save, delete, and reorder, including when the app runs from `file://`, so the current palette set can be bookmarked locally.
- Opening a URL with a `palettes` query parameter restores that palette set, including an explicitly empty set.
- Legacy empty stored lists without the initialization marker are re-seeded with the default palettes; explicit empty lists saved afterwards are preserved.
- On load, a valid URL query parameter wins over localStorage; otherwise stored palettes are used; only when neither exists are the default palettes seeded.
- Malformed URL or localStorage data falls back gracefully.
- Default palettes are a built-in set of 16 palettes with hue, shade-500 chroma and lightness, plus lightness, chroma boost and hue shift settings for the 50 and 900 endpoints.

## Distribution
- `npm run build` produces a single self-contained `dist/index.html` with CSS, JS and the favicon inlined.
- The same file can be opened directly in a browser via `file://` or copied to a web server.
- Verification: lint, unit tests, production build, local `file://` check, and manual browser check.
