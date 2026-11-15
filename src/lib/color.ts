import { clampChroma, formatHex, oklch } from 'culori'
import type { Palette, Swatch } from '../types'
import { hueDriftAt } from './hueDrift'

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const

export const CHROMA_PROFILE = [
  0.1345, 0.3392, 0.5573, 0.7615, 0.9001, 1, 0.96, 0.9117, 0.867, 0.8148,
] as const

export const DEFAULT_VALUES = {
  hue: 220,
  chroma: 0.12,
  lightest: 0.97,
  middle: 0.55,
  darkest: 0.22,
} as const

export const LIMITS = {
  hue: { min: 0, max: 360, step: 1 },
  chroma: { min: 0, max: 0.4, step: 0.005 },
  lightest: { min: 0.9, max: 0.99, step: 0.005 },
  middle: { min: 0.08, max: 0.99, step: 0.005 },
  darkest: { min: 0.08, max: 0.8, step: 0.005 },
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
  middle: number,
  darkest: number,
): number {
  const t = index / (SHADES.length - 1)
  return pchip(
    [
      [0, lightest],
      [5 / 9, middle],
      [1, darkest],
    ],
    t,
  )
}

export function generateSwatches(
  palette: Pick<
    Palette,
    'hue' | 'chroma' | 'lightest' | 'middle' | 'darkest'
  >,
): Swatch[] {
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
  const middle = clampValue(
    palette.middle,
    Math.max(LIMITS.middle.min, darkest + 0.005),
    Math.min(LIMITS.middle.max, lightest - 0.005),
  )

  return SHADES.map((shade, index) => {
    const t = index / (SHADES.length - 1)
    const lightness = lightnessForShade(index, lightest, middle, darkest)
    const raw = oklch({
      mode: 'oklch',
      l: lightness,
      c: chroma * CHROMA_PROFILE[index],
      h: normalizeHue(hue + hueDriftAt(hue, t)),
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
