import type { Palette, PaletteDraft } from '../types'
import { DEFAULT_VALUES, LIMITS, clampValue, normalizeHue } from './color'

export const MAX_NAME_LENGTH = 60

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `palette_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH)
}

export function nameKey(name: string): string {
  return normalizeName(name).toLowerCase()
}

function normalizeValues(
  draft: Pick<
    PaletteDraft,
    'hue' | 'chroma' | 'lightest' | 'middle' | 'darkest'
  >,
) {
  const lightest = clampValue(
    draft.lightest,
    LIMITS.lightest.min,
    LIMITS.lightest.max,
  )
  const darkest = clampValue(
    draft.darkest,
    LIMITS.darkest.min,
    LIMITS.darkest.max,
  )

  return {
    hue: clampValue(normalizeHue(draft.hue), LIMITS.hue.min, LIMITS.hue.max),
    chroma: clampValue(draft.chroma, LIMITS.chroma.min, LIMITS.chroma.max),
    lightest,
    middle: clampValue(
      draft.middle,
      Math.max(LIMITS.middle.min, darkest + 0.005),
      Math.min(LIMITS.middle.max, lightest - 0.005),
    ),
    darkest,
  }
}

function legacyMiddleLightness(
  lightest: number,
  darkest: number,
  lightCurve: number,
  darkCurve: number,
): number {
  const t = 5 / 9
  const light = t ** lightCurve
  const dark = (1 - t) ** darkCurve
  return lightest + (darkest - lightest) * (light / (light + dark))
}

export interface SavePaletteResult {
  palettes: Palette[]
  saved: Palette
  overwritten: boolean
}

export function savePalette(
  palettes: Palette[],
  draft: PaletteDraft,
): SavePaletteResult | null {
  const name = normalizeName(draft.name)
  if (!name) {
    return null
  }

  const key = nameKey(name)
  const values = normalizeValues(draft)
  const existingIndex = palettes.findIndex(
    (palette) => nameKey(palette.name) === key,
  )

  if (existingIndex >= 0) {
    const saved: Palette = {
      ...palettes[existingIndex],
      name,
      ...values,
    }
    const next = [...palettes]
    next[existingIndex] = saved
    return { palettes: next, saved, overwritten: true }
  }

  const saved: Palette = {
    id: createId(),
    name,
    ...values,
  }

  return { palettes: [...palettes, saved], saved, overwritten: false }
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function entryToRecord(entry: unknown): Record<string, unknown> | null {
  if (Array.isArray(entry)) {
    if (entry.length === 7 && entry[6] === 'a5') {
      return {
        name: entry[0],
        hue: entry[1],
        chroma: entry[2],
        lightest: entry[3],
        middle: entry[4],
        darkest: entry[5],
      }
    }

    if (entry.length === 7) {
      return {
        name: entry[0],
        hue: entry[1],
        chroma: entry[2],
        lightest: entry[3],
        darkest: entry[4],
        lightCurve: entry[5],
        darkCurve: entry[6],
      }
    }

    if (entry.length === 6) {
      return {
        name: entry[0],
        hue: entry[1],
        chroma: entry[2],
        lightest: entry[3],
        darkest: entry[4],
        curve: entry[5],
      }
    }

    if (entry.length === 4) {
      return {
        name: entry[0],
        hue: entry[1],
        chroma: entry[2],
        gamma: entry[3],
      }
    }

    return null
  }

  if (entry && typeof entry === 'object') {
    return entry as Record<string, unknown>
  }

  return null
}

function paletteFromEntry(entry: unknown): Palette | null {
  const record = entryToRecord(entry)

  if (!record) {
    return null
  }

  const name = typeof record.name === 'string' ? normalizeName(record.name) : ''
  const hue = toFiniteNumber(record.hue)
  const chroma = toFiniteNumber(record.chroma)
  const lightest = toFiniteNumber(record.lightest)
  const middle = toFiniteNumber(record.middle)
  const darkest = toFiniteNumber(record.darkest)
  const lightCurve = toFiniteNumber(record.lightCurve)
  const darkCurve = toFiniteNumber(record.darkCurve)
  const curve = toFiniteNumber(record.curve)
  const gamma = toFiniteNumber(record.gamma)

  if (!name || hue === null || chroma === null) {
    return null
  }

  let values: ReturnType<typeof normalizeValues>

  if (lightest !== null && middle !== null && darkest !== null) {
    values = normalizeValues({ hue, chroma, lightest, middle, darkest })
  } else {
    const legacyLightCurve = lightCurve ?? curve ?? gamma
    const legacyDarkCurve = darkCurve ?? curve ?? gamma

    if (legacyLightCurve === null || legacyDarkCurve === null) {
      return null
    }

    const baseLightest = lightest ?? DEFAULT_VALUES.lightest
    const baseDarkest = darkest ?? DEFAULT_VALUES.darkest

    values = normalizeValues({
      hue,
      chroma,
      lightest: baseLightest,
      middle: legacyMiddleLightness(
        baseLightest,
        baseDarkest,
        legacyLightCurve,
        legacyDarkCurve,
      ),
      darkest: baseDarkest,
    })
  }

  const id =
    typeof record.id === 'string' && record.id.length > 0
      ? record.id
      : createId()

  return {
    id,
    name,
    ...values,
  }
}

export function sanitizePaletteList(input: unknown): Palette[] | null {
  if (!Array.isArray(input)) {
    return null
  }

  const palettes: Palette[] = []
  const seen = new Set<string>()

  for (const entry of input) {
    const palette = paletteFromEntry(entry)
    if (!palette) {
      return null
    }

    const key = nameKey(palette.name)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    palettes.push(palette)
  }

  return palettes
}

export function serializePalettes(palettes: Palette[]): string {
  return palettes
    .map(
      (palette) =>
        `${palette.hue},${palette.chroma},${palette.lightest},${palette.middle},${palette.darkest},${palette.name}`,
    )
    .join('\n')
}

export function movePaletteBy(
  palettes: Palette[],
  id: string,
  offset: number,
): Palette[] {
  const index = palettes.findIndex((palette) => palette.id === id)
  const targetIndex = index + offset

  if (index < 0 || targetIndex < 0 || targetIndex >= palettes.length) {
    return palettes
  }

  const next = [...palettes]
  const [moved] = next.splice(index, 1)
  next.splice(targetIndex, 0, moved)
  return next
}
