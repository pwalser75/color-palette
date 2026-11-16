import { describe, expect, it } from 'vitest'
import {
  SHADES,
  chromaForShade,
  generateSwatches,
  hueForShade,
  lightnessForShade,
} from './color'
import type { PaletteValues } from '../types'

const HEX_PATTERN = /^#[0-9a-f]{6}$/
const VALUES: PaletteValues = {
  hue: 220,
  chroma: 0.12,
  shade500: 0.55,
  lightest: 0.97,
  lightestChromaBoost: 0.15,
  lightestHueShift: 0,
  darkest: 0.22,
  darkestChromaBoost: 0.8,
  darkestHueShift: 0,
}

describe('lightnessForShade', () => {
  it('anchors the ramp at 50, 500 and 900', () => {
    expect(lightnessForShade(0, 0.97, 0.55, 0.22)).toBeCloseTo(0.97, 6)
    expect(lightnessForShade(5, 0.97, 0.55, 0.22)).toBeCloseTo(0.55, 6)
    expect(lightnessForShade(9, 0.97, 0.55, 0.22)).toBeCloseTo(0.22, 6)
  })

  it('decreases lightness monotonically for every valid anchor set', () => {
    for (const lightest of [0.9, 0.95, 0.99]) {
      for (const shade500 of [0.4, 0.55, 0.75]) {
        for (const darkest of [0.08, 0.22, 0.5, 0.8]) {
          if (shade500 <= darkest || shade500 >= lightest) {
            continue
          }

          for (let index = 1; index < SHADES.length; index += 1) {
            expect(
              lightnessForShade(index, lightest, shade500, darkest),
            ).toBeLessThan(
              lightnessForShade(index - 1, lightest, shade500, darkest),
            )
          }
        }
      }
    }
  })

  it('keeps ten distinct shades across the allowed endpoint range', () => {
    const swatches = generateSwatches({
      ...VALUES,
      lightest: 0.9,
      shade500: 0.6,
      darkest: 0.35,
    })
    const lightnesses = swatches.map((swatch) => swatch.lightness)

    expect(new Set(lightnesses).size).toBe(10)
    expect(lightnesses[0] - lightnesses[9]).toBeCloseTo(0.55, 6)
  })
})

describe('chromaForShade', () => {
  it('anchors the chroma ramp at 50, 500 and 900', () => {
    expect(chromaForShade(0, 0.12, 0.15, 0.8)).toBeCloseTo(0.018, 6)
    expect(chromaForShade(5, 0.12, 0.15, 0.8)).toBeCloseTo(0.12, 6)
    expect(chromaForShade(9, 0.12, 0.15, 0.8)).toBeCloseTo(0.096, 6)
  })

  it('applies the endpoint boosts as factors on the base chroma', () => {
    expect(chromaForShade(0, 0.1, 2, 0.5)).toBeCloseTo(0.2, 6)
    expect(chromaForShade(9, 0.1, 2, 0.5)).toBeCloseTo(0.05, 6)
  })

  it('never returns negative chroma', () => {
    for (let index = 0; index < SHADES.length; index += 1) {
      expect(chromaForShade(index, 0, 0, 0)).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('hueForShade', () => {
  it('keeps shade 500 at the base hue', () => {
    expect(hueForShade(5, 220, 30, -40)).toBeCloseTo(220, 6)
  })

  it('applies and normalizes the endpoint hue shifts', () => {
    expect(hueForShade(0, 220, 30, -40)).toBeCloseTo(250, 6)
    expect(hueForShade(9, 220, 30, -40)).toBeCloseTo(180, 6)
    expect(hueForShade(0, 10, -30, 20)).toBeCloseTo(340, 6)
    expect(hueForShade(9, 350, -30, 40)).toBeCloseTo(30, 6)
  })
})

describe('generateSwatches', () => {
  it('returns all ten shade values in order', () => {
    expect(generateSwatches(VALUES).map((swatch) => swatch.shade)).toEqual([
      ...SHADES,
    ])
  })

  it('produces valid displayable hex values for every hue at max chroma', () => {
    for (let hue = 0; hue < 360; hue += 5) {
      const swatches = generateSwatches({
        ...VALUES,
        hue,
        chroma: 0.4,
        lightest: 0.99,
        lightestChromaBoost: 2,
        shade500: 0.7,
        darkest: 0.08,
        darkestChromaBoost: 2,
      })

      for (const swatch of swatches) {
        expect(swatch.hex).toMatch(HEX_PATTERN)
        expect(swatch.chroma).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('produces neutral grays when chroma is zero', () => {
    const swatches = generateSwatches({ ...VALUES, chroma: 0 })

    for (const swatch of swatches) {
      const red = swatch.hex.slice(1, 3)
      const green = swatch.hex.slice(3, 5)
      const blue = swatch.hex.slice(5, 7)
      expect(green).toBe(red)
      expect(blue).toBe(red)
    }
  })

  it('applies the lightest and darkest chroma boosts', () => {
    const swatches = generateSwatches({
      ...VALUES,
      hue: 30,
      chroma: 0.1,
      lightestChromaBoost: 0.1,
      darkestChromaBoost: 0.2,
    })

    expect(swatches[0].chroma).toBeCloseTo(0.01, 3)
    expect(swatches[9].chroma).toBeCloseTo(0.02, 3)
  })

  it('changes the palette when hue shifts change', () => {
    const neutral = generateSwatches(VALUES)
    const shifted = generateSwatches({
      ...VALUES,
      lightestHueShift: 40,
      darkestHueShift: -40,
    })

    expect(shifted[0].hex).not.toBe(neutral[0].hex)
    expect(shifted[9].hex).not.toBe(neutral[9].hex)
  })

  it('changes the mid shade when hue changes', () => {
    const blue = generateSwatches({ ...VALUES, hue: 240, chroma: 0.14 })[5]
    const orange = generateSwatches({ ...VALUES, hue: 55, chroma: 0.14 })[5]
    expect(blue.hex).not.toBe(orange.hex)
  })
})
