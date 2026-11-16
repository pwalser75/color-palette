import { describe, expect, it } from 'vitest'
import type { Palette, PaletteDraft } from '../types'
import {
  MAX_NAME_LENGTH,
  movePaletteBy,
  nameKey,
  normalizeName,
  sanitizePaletteList,
  savePalette,
  serializePalettes,
} from './palette'

function makePalette(overrides: Partial<Palette> = {}): Palette {
  return {
    id: 'palette-one',
    name: 'Ocean',
    hue: 220,
    chroma: 0.12,
    shade500: 0.55,
    lightest: 0.97,
    lightestChromaBoost: 0.15,
    lightestHueShift: 0,
    darkest: 0.22,
    darkestChromaBoost: 0.8,
    darkestHueShift: 0,
    ...overrides,
  }
}

function makeDraft(overrides: Partial<PaletteDraft> = {}): PaletteDraft {
  const palette = makePalette()
  return {
    name: palette.name,
    hue: palette.hue,
    chroma: palette.chroma,
    shade500: palette.shade500,
    lightest: palette.lightest,
    lightestChromaBoost: palette.lightestChromaBoost,
    lightestHueShift: palette.lightestHueShift,
    darkest: palette.darkest,
    darkestChromaBoost: palette.darkestChromaBoost,
    darkestHueShift: palette.darkestHueShift,
    ...overrides,
  }
}

describe('normalizeName', () => {
  it('trims and collapses internal whitespace', () => {
    expect(normalizeName('  Ocean   blue  ')).toBe('Ocean blue')
  })

  it('limits names to the maximum length', () => {
    expect(normalizeName('x'.repeat(MAX_NAME_LENGTH + 10))).toHaveLength(
      MAX_NAME_LENGTH,
    )
  })

  it('builds case-insensitive keys', () => {
    expect(nameKey(' Ocean Blue ')).toBe(nameKey('ocean blue'))
  })
})

describe('savePalette', () => {
  it('rejects an empty name', () => {
    expect(savePalette([], makeDraft({ name: '   ' }))).toBeNull()
  })

  it('creates a new palette with normalized values', () => {
    const result = savePalette([], makeDraft({ name: '  Ocean   blue ' }))

    expect(result).not.toBeNull()
    expect(result?.palettes).toHaveLength(1)
    expect(result?.saved.name).toBe('Ocean blue')
    expect(result?.overwritten).toBe(false)
    expect(result?.saved.id).toBeTruthy()
  })

  it('overwrites an existing palette case-insensitively and keeps its id', () => {
    const existing = makePalette()
    const result = savePalette(
      [existing],
      makeDraft({
        name: 'OCEAN',
        hue: 30,
        chroma: 0.2,
        shade500: 0.6,
        lightest: 0.93,
        lightestChromaBoost: 0.3,
        lightestHueShift: 12,
        darkest: 0.12,
        darkestChromaBoost: 1.4,
        darkestHueShift: -8,
      }),
    )

    expect(result?.overwritten).toBe(true)
    expect(result?.palettes).toHaveLength(1)
    expect(result?.saved.id).toBe(existing.id)
    expect(result?.saved.name).toBe('OCEAN')
    expect(result?.saved.hue).toBe(30)
    expect(result?.saved.chroma).toBe(0.2)
    expect(result?.saved.shade500).toBe(0.6)
    expect(result?.saved.lightest).toBe(0.93)
    expect(result?.saved.lightestChromaBoost).toBe(0.3)
    expect(result?.saved.lightestHueShift).toBe(12)
    expect(result?.saved.darkest).toBe(0.12)
    expect(result?.saved.darkestChromaBoost).toBe(1.4)
    expect(result?.saved.darkestHueShift).toBe(-8)
  })

  it('creates a new entry when the name changes', () => {
    const existing = makePalette()
    const result = savePalette(
      [existing],
      makeDraft({ name: 'Sea glass', hue: 180, chroma: 0.1 }),
    )

    expect(result?.overwritten).toBe(false)
    expect(result?.palettes).toHaveLength(2)
    expect(result?.palettes[0]).toEqual(existing)
    expect(result?.saved.id).not.toBe(existing.id)
  })

  it('clamps values above the supported ranges', () => {
    const result = savePalette(
      [],
      makeDraft({
        name: 'Clamped high',
        hue: 400,
        chroma: 5,
        shade500: 5,
        lightest: 1,
        lightestChromaBoost: 9,
        lightestHueShift: 200,
        darkest: 0.9,
        darkestChromaBoost: 9,
        darkestHueShift: 200,
      }),
    )

    expect(result?.saved.hue).toBe(40)
    expect(result?.saved.chroma).toBe(0.4)
    expect(result?.saved.lightest).toBe(0.99)
    expect(result?.saved.shade500).toBe(0.985)
    expect(result?.saved.lightestChromaBoost).toBe(5)
    expect(result?.saved.lightestHueShift).toBe(45)
    expect(result?.saved.darkest).toBe(0.8)
    expect(result?.saved.darkestChromaBoost).toBe(5)
    expect(result?.saved.darkestHueShift).toBe(45)
  })

  it('clamps values below the supported ranges', () => {
    const result = savePalette(
      [],
      makeDraft({
        name: 'Clamped low',
        chroma: -1,
        shade500: 0,
        lightest: 0.5,
        lightestChromaBoost: -1,
        lightestHueShift: -200,
        darkest: 0,
        darkestChromaBoost: -1,
        darkestHueShift: -200,
      }),
    )

    expect(result?.saved.chroma).toBe(0)
    expect(result?.saved.lightest).toBe(0.9)
    expect(result?.saved.shade500).toBe(0.085)
    expect(result?.saved.lightestChromaBoost).toBe(0)
    expect(result?.saved.lightestHueShift).toBe(-45)
    expect(result?.saved.darkest).toBe(0.08)
    expect(result?.saved.darkestChromaBoost).toBe(0)
    expect(result?.saved.darkestHueShift).toBe(-45)
  })

  it('keeps shade 500 between the endpoints', () => {
    const result = savePalette(
      [],
      makeDraft({
        name: 'Endpoints',
        lightest: 0.97,
        shade500: 0.1,
        darkest: 0.6,
      }),
    )

    expect(result?.saved.lightest).toBe(0.97)
    expect(result?.saved.darkest).toBe(0.6)
    expect(result?.saved.shade500).toBe(0.605)
  })
})

describe('sanitizePaletteList', () => {
  it('restores new tuple and object entries', () => {
    const list = sanitizePaletteList([
      ['Ocean', 220, 0.12, 0.55, 0.97, 0.15, 0, 0.22, 0.8, 0],
      {
        id: 'two',
        name: 'Amber',
        hue: 55,
        chroma: 0.16,
        shade500: 0.72,
        lightest: 0.95,
        lightestChromaBoost: 0.2,
        lightestHueShift: 5,
        darkest: 0.3,
        darkestChromaBoost: 1.2,
        darkestHueShift: -5,
      },
    ])

    expect(list).toHaveLength(2)
    expect(list?.[0].name).toBe('Ocean')
    expect(list?.[0].shade500).toBe(0.55)
    expect(list?.[0].lightestChromaBoost).toBe(0.15)
    expect(list?.[0].darkestChromaBoost).toBe(0.8)
    expect(list?.[1].id).toBe('two')
    expect(list?.[1].lightest).toBe(0.95)
    expect(list?.[1].shade500).toBe(0.72)
    expect(list?.[1].lightestHueShift).toBe(5)
    expect(list?.[1].darkestHueShift).toBe(-5)
  })

  it('migrates legacy seven-value tuples with light and dark curves', () => {
    const list = sanitizePaletteList([
      ['Legacy seven', 220, 0.12, 0.97, 0.22, 1.2, 0.8],
    ])

    expect(list).toHaveLength(1)
    expect(list?.[0].lightest).toBe(0.97)
    expect(list?.[0].darkest).toBe(0.22)
    expect(list?.[0].shade500).toBeCloseTo(0.606, 2)
    expect(list?.[0].lightestChromaBoost).toBe(0.15)
    expect(list?.[0].darkestChromaBoost).toBe(0.8)
    expect(list?.[0].lightestHueShift).toBe(0)
    expect(list?.[0].darkestHueShift).toBe(0)
  })

  it('migrates legacy six-value tuples and curve objects', () => {
    const list = sanitizePaletteList([
      ['Legacy six', 220, 0.12, 0.97, 0.22, 1.3],
      {
        id: 'legacy-object',
        name: 'Legacy object',
        hue: 30,
        chroma: 0.2,
        lightest: 0.95,
        darkest: 0.3,
        curve: 2,
      },
    ])

    expect(list).toHaveLength(2)
    expect(list?.[0].shade500).toBeCloseTo(0.541, 2)
    expect(list?.[1].shade500).toBeCloseTo(0.554, 2)
  })

  it('migrates legacy tuples and objects containing gamma', () => {
    const list = sanitizePaletteList([
      ['Legacy tuple', 220, 0.12, 1.3],
      {
        id: 'legacy-object',
        name: 'Legacy object',
        hue: 30,
        chroma: 0.2,
        gamma: 2,
      },
    ])

    expect(list).toHaveLength(2)
    expect(list?.[0].lightest).toBe(0.97)
    expect(list?.[0].darkest).toBe(0.22)
    expect(list?.[0].shade500).toBeCloseTo(0.541, 2)
    expect(list?.[1].id).toBe('legacy-object')
    expect(list?.[1].shade500).toBeCloseTo(0.512, 2)
  })

  it('migrates legacy shade-500 entries without endpoint settings', () => {
    const list = sanitizePaletteList([
      {
        id: 'legacy',
        name: 'Legacy',
        hue: 220,
        chroma: 0.12,
        lightest: 0.97,
        middle: 0.55,
        darkest: 0.22,
      },
    ])

    expect(list?.[0].shade500).toBe(0.55)
    expect(list?.[0].lightestChromaBoost).toBe(0.15)
    expect(list?.[0].darkestChromaBoost).toBe(0.8)
  })

  it('drops duplicate names and keeps the first entry', () => {
    const list = sanitizePaletteList([
      ['Ocean', 220, 0.12, 0.97, 0.55, 0.22, 'a5'],
      [' ocean ', 30, 0.2, 0.9, 0.6, 0.3, 'a5'],
    ])

    expect(list).toHaveLength(1)
    expect(list?.[0].hue).toBe(220)
  })

  it('returns null for malformed input', () => {
    expect(sanitizePaletteList(null)).toBeNull()
    expect(
      sanitizePaletteList([['', 220, 0.12, 0.97, 0.55, 0.22, 'a5']]),
    ).toBeNull()
    expect(
      sanitizePaletteList([['Ocean', 'blue', 0.12, 0.97, 0.55, 0.22, 'a5']]),
    ).toBeNull()
    expect(
      sanitizePaletteList([['Ocean', 220, 0.12, 0.97, 0.22]]),
    ).toBeNull()
  })
})

describe('serializePalettes', () => {
  it('writes compact CSV lines with parameters before the name', () => {
    expect(serializePalettes([makePalette()])).toBe(
      '220,0.12,0.55,0.97,0.15,0,0.22,0.8,0,Ocean',
    )
  })

  it('writes one line per palette', () => {
    expect(
      serializePalettes([
        makePalette({ name: 'Ocean' }),
        makePalette({ id: 'two', name: 'Sea glass', hue: 180 }),
      ]),
    ).toBe(
      '220,0.12,0.55,0.97,0.15,0,0.22,0.8,0,Ocean\n180,0.12,0.55,0.97,0.15,0,0.22,0.8,0,Sea glass',
    )
  })
})

describe('reordering', () => {
  const palettes = [
    makePalette({ id: 'a', name: 'A' }),
    makePalette({ id: 'b', name: 'B' }),
    makePalette({ id: 'c', name: 'C' }),
    makePalette({ id: 'd', name: 'D' }),
  ]

  it('moves an item by keyboard offset', () => {
    expect(movePaletteBy(palettes, 'b', 1).map((item) => item.id)).toEqual([
      'a',
      'c',
      'b',
      'd',
    ])
    expect(movePaletteBy(palettes, 'b', -1).map((item) => item.id)).toEqual([
      'b',
      'a',
      'c',
      'd',
    ])
  })
})
