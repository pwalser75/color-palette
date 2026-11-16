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
      expect(palette.lightestChromaBoost).toBeGreaterThanOrEqual(
        LIMITS.lightestChromaBoost.min,
      )
      expect(palette.lightestChromaBoost).toBeLessThanOrEqual(
        LIMITS.lightestChromaBoost.max,
      )
      expect(palette.lightestHueShift).toBeGreaterThanOrEqual(
        LIMITS.lightestHueShift.min,
      )
      expect(palette.lightestHueShift).toBeLessThanOrEqual(
        LIMITS.lightestHueShift.max,
      )
      expect(palette.shade500).toBeGreaterThan(palette.darkest)
      expect(palette.shade500).toBeLessThan(palette.lightest)
      expect(palette.shade500).toBeGreaterThanOrEqual(LIMITS.shade500.min)
      expect(palette.shade500).toBeLessThanOrEqual(LIMITS.shade500.max)
      expect(palette.darkest).toBeGreaterThanOrEqual(LIMITS.darkest.min)
      expect(palette.darkest).toBeLessThanOrEqual(LIMITS.darkest.max)
      expect(palette.darkestChromaBoost).toBeGreaterThanOrEqual(
        LIMITS.darkestChromaBoost.min,
      )
      expect(palette.darkestChromaBoost).toBeLessThanOrEqual(
        LIMITS.darkestChromaBoost.max,
      )
      expect(palette.darkestHueShift).toBeGreaterThanOrEqual(
        LIMITS.darkestHueShift.min,
      )
      expect(palette.darkestHueShift).toBeLessThanOrEqual(
        LIMITS.darkestHueShift.max,
      )
    }
  })

  it('returns fresh palette objects on each call', () => {
    const first = createDefaultPalettes()
    const second = createDefaultPalettes()

    expect(first[0]).not.toBe(second[0])
    expect(first[0]).toEqual(second[0])
  })
})
