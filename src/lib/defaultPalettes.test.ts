import { describe, expect, it } from 'vitest'
import { LIMITS } from './color'
import { createDefaultPalettes } from './defaultPalettes'

const EXPECTED_NAMES = [
  'Red',
  'Orange',
  'Amber',
  'Yellow',
  'Lime',
  'Green',
  'Teal',
  'Cyan',
  'Blue',
  'Indigo',
  'Purple',
  'Pink',
  'Brown',
  'Cold Gray',
  'Gray',
  'Warm Gray',
]

describe('createDefaultPalettes', () => {
  it('creates all built-in palettes with unique names and ids', () => {
    const palettes = createDefaultPalettes()

    expect(palettes.map((palette) => palette.name)).toEqual(EXPECTED_NAMES)
    expect(new Set(palettes.map((palette) => palette.id)).size).toBe(
      palettes.length,
    )
    expect(new Set(palettes.map((palette) => palette.name)).size).toBe(
      palettes.length,
    )
  })

  it('keeps every value inside the editor limits', () => {
    for (const palette of createDefaultPalettes()) {
      expect(palette.hue).toBeGreaterThanOrEqual(LIMITS.hue.min)
      expect(palette.hue).toBeLessThanOrEqual(LIMITS.hue.max)
      expect(palette.chroma).toBeGreaterThanOrEqual(LIMITS.chroma.min)
      expect(palette.chroma).toBeLessThanOrEqual(LIMITS.chroma.max)
      expect(palette.lightest).toBeGreaterThanOrEqual(LIMITS.lightest.min)
      expect(palette.lightest).toBeLessThanOrEqual(LIMITS.lightest.max)
      expect(palette.middle).toBeGreaterThan(palette.darkest)
      expect(palette.middle).toBeLessThan(palette.lightest)
      expect(palette.middle).toBeGreaterThanOrEqual(LIMITS.middle.min)
      expect(palette.middle).toBeLessThanOrEqual(LIMITS.middle.max)
      expect(palette.darkest).toBeGreaterThanOrEqual(LIMITS.darkest.min)
      expect(palette.darkest).toBeLessThanOrEqual(LIMITS.darkest.max)
    }
  })

  it('returns fresh palette objects on each call', () => {
    const first = createDefaultPalettes()
    const second = createDefaultPalettes()

    expect(first[0]).not.toBe(second[0])
    expect(first[0]).toEqual(second[0])
  })
})
