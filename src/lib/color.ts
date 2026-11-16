import { clampChroma, formatHex, oklch } from 'culori'
import type { PaletteValues, Swatch } from '../types'

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const

export const DEFAULT_VALUES = {
  hue: 220,
  chroma: 0.12,
  shade500: 0.55,
  lightest: 0.97,
  lightestChromaBoost: 0.15,
  lightestHueShift: 0,
  darkest: 0.22,
  darkestChromaBoost: 0.8,
  darkestHueShift: 0,
} as const

export const LIMITS = {
  hue: { min: 0, max: 360, step: 1 },
  chroma: { min: 0, max: 0.4, step: 0.005 },
  shade500: { min: 0.08, max: 0.99, step: 0.005 },
  lightest: { min: 0.9, max: 0.99, step: 0.005 },
  lightestChromaBoost: { min: 0, max: 5, step: 0.05 },
  lightestHueShift: { min: -45, max: 45, step: 1 },
  darkest: { min: 0.08, max: 0.8, step: 0.005 },
  darkestChromaBoost: { min: 0, max: 5, step: 0.05 },
  darkestHueShift: { min: -45, max: 45, step: 1 },
} as const

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

function pchip(anchors: [number, number][], x: number): number {
  const n = anchors.length
  if (n === 1) {
    return anchors[0][1]
  }

  const h: number[] = []
  const delta: number[] = []

  for (let i = 0; i < n - 1; i += 1) {
    h[i] = anchors[i + 1][0] - anchors[i][0]
    delta[i] = (anchors[i + 1][1] - anchors[i][1]) / h[i]
  }

  const slopes = new Array<number>(n).fill(0)
  slopes[0] = delta[0]
  slopes[n - 1] = delta[n - 2]

  for (let i = 1; i < n - 1; i += 1) {
    if (delta[i - 1] * delta[i] <= 0) {
      slopes[i] = 0
    } else {
      const w1 = 2 * h[i] + h[i - 1]
      const w2 = h[i] + 2 * h[i - 1]
      slopes[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i])
    }
  }

  for (const i of [0, n - 1]) {
    const d = delta[i === 0 ? 0 : n - 2]
    if (d === 0) {
      slopes[i] = 0
    } else {
      const ratio = slopes[i] / d
      if (ratio < 0) {
        slopes[i] = 0
      } else if (ratio > 3) {
        slopes[i] = 3 * d
      }
    }
  }

  let index = 0
  while (index < n - 2 && x > anchors[index + 1][0]) {
    index += 1
  }

  const [x0, y0] = anchors[index]
  const [x1, y1] = anchors[index + 1]
  const width = x1 - x0

  if (width === 0) {
    return y1
  }

  const u = (x - x0) / width
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1
  const h10 = u ** 3 - 2 * u ** 2 + u
  const h01 = -2 * u ** 3 + 3 * u ** 2
  const h11 = u ** 3 - u ** 2

  return (
    h00 * y0 +
    h10 * width * slopes[index] +
    h01 * y1 +
    h11 * width * slopes[index + 1]
  )
}

export function lightnessForShade(
  index: number,
  lightest: number,
  shade500: number,
  darkest: number,
): number {
  const t = index / (SHADES.length - 1)
  return pchip(
    [
      [0, lightest],
      [5 / 9, shade500],
      [1, darkest],
    ],
    t,
  )
}

export function chromaForShade(
  index: number,
  chroma: number,
  lightestChromaBoost: number,
  darkestChromaBoost: number,
): number {
  const t = index / (SHADES.length - 1)
  return Math.max(
    0,
    pchip(
      [
        [0, chroma * lightestChromaBoost],
        [5 / 9, chroma],
        [1, chroma * darkestChromaBoost],
      ],
      t,
    ),
  )
}

export function hueForShade(
  index: number,
  hue: number,
  lightestHueShift: number,
  darkestHueShift: number,
): number {
  const t = index / (SHADES.length - 1)
  return normalizeHue(
    pchip(
      [
        [0, hue + lightestHueShift],
        [5 / 9, hue],
        [1, hue + darkestHueShift],
      ],
      t,
    ),
  )
}

export function generateSwatches(palette: PaletteValues): Swatch[] {
  const hue = normalizeHue(palette.hue)
  const chroma = clampValue(
    palette.chroma,
    LIMITS.chroma.min,
    LIMITS.chroma.max,
  )
  const lightest = clampValue(
    palette.lightest,
    LIMITS.lightest.min,
    LIMITS.lightest.max,
  )
  const darkest = clampValue(
    palette.darkest,
    LIMITS.darkest.min,
    LIMITS.darkest.max,
  )
  const shade500 = clampValue(
    palette.shade500,
    Math.max(LIMITS.shade500.min, darkest + 0.005),
    Math.min(LIMITS.shade500.max, lightest - 0.005),
  )
  const lightestChromaBoost = clampValue(
    palette.lightestChromaBoost,
    LIMITS.lightestChromaBoost.min,
    LIMITS.lightestChromaBoost.max,
  )
  const darkestChromaBoost = clampValue(
    palette.darkestChromaBoost,
    LIMITS.darkestChromaBoost.min,
    LIMITS.darkestChromaBoost.max,
  )
  const lightestHueShift = clampValue(
    palette.lightestHueShift,
    LIMITS.lightestHueShift.min,
    LIMITS.lightestHueShift.max,
  )
  const darkestHueShift = clampValue(
    palette.darkestHueShift,
    LIMITS.darkestHueShift.min,
    LIMITS.darkestHueShift.max,
  )

  return SHADES.map((shade, index) => {
    const lightness = lightnessForShade(index, lightest, shade500, darkest)
    const raw = oklch({
      mode: 'oklch',
      l: lightness,
      c: chromaForShade(
        index,
        chroma,
        lightestChromaBoost,
        darkestChromaBoost,
      ),
      h: hueForShade(index, hue, lightestHueShift, darkestHueShift),
    })
    const inGamut = clampChroma(raw, 'oklch', 'rgb')

    return {
      shade,
      lightness,
      chroma: inGamut.c,
      hex: formatHex(inGamut),
    }
  })
}
