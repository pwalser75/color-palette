import { describe, expect, it } from 'vitest'
import { SHADES, generateSwatches, lightnessForShade } from './color'
import { hueDriftAt } from './hueDrift'

const HEX_PATTERN = /^#[0-9a-f]{6}$/
const LIGHTEST = 0.97
const MIDDLE = 0.55
const DARKEST = 0.22

describe('lightnessForShade', () => {
  it('anchors the ramp at 50, 500 and 900', () => {
    expect(lightnessForShade(0, LIGHTEST, MIDDLE, DARKEST)).toBeCloseTo(
      LIGHTEST,
      6,
    )
    expect(lightnessForShade(5, LIGHTEST, MIDDLE, DARKEST)).toBeCloseTo(
      MIDDLE,
      6,
    )
    expect(lightnessForShade(9, LIGHTEST, MIDDLE, DARKEST)).toBeCloseTo(
      DARKEST,
      6,
    )
  })

  it('decreases lightness monotonically for every valid anchor set', () => {
    for (const lightest of [0.9, 0.95, 0.99]) {
      for (const middle of [0.4, 0.55, 0.75]) {
        for (const darkest of [0.08, 0.22, 0.5, 0.8]) {
          if (middle <= darkest || middle >= lightest) {
            continue
          }

          for (let index = 1; index < SHADES.length; index += 1) {
            expect(
              lightnessForShade(index, lightest, middle, darkest),
            ).toBeLessThan(
              lightnessForShade(index - 1, lightest, middle, darkest),
            )
          }
        }
      }
    }
  })

  it('keeps ten distinct shades across the allowed endpoint range', () => {
    const swatches = generateSwatches({
      hue: 220,
      chroma: 0.12,
      lightest: 0.9,
      middle: 0.6,
      darkest: 0.35,
    })
    const lightnesses = swatches.map((swatch) => swatch.lightness)

    expect(new Set(lightnesses).size).toBe(10)
    expect(lightnesses[0] - lightnesses[9]).toBeCloseTo(0.55, 6)
  })
})

describe('hueDriftAt', () => {
  it('keeps shade 500 at the base hue', () => {
    expect(hueDriftAt(102, 5 / 9)).toBeCloseTo(0, 6)
  })

  it('moves warm hues toward red at the dark end', () => {
    expect(hueDriftAt(102, 1)).toBeLessThan(-20)
    expect(hueDriftAt(85, 1)).toBeLessThan(-20)
  })

  it('moves blue hues toward violet at the dark end', () => {
    expect(hueDriftAt(249, 1)).toBeGreaterThan(5)
  })
})

describe('generateSwatches', () => {
  it('returns all ten shade values in order', () => {
    const swatches = generateSwatches({
      hue: 220,
      chroma: 0.12,
      lightest: LIGHTEST,
      middle: MIDDLE,
      darkest: DARKEST,
    })
    expect(swatches.map((swatch) => swatch.shade)).toEqual([...SHADES])
  })

  it('produces valid displayable hex values for every hue at max chroma', () => {
    for (let hue = 0; hue < 360; hue += 5) {
      const swatches = generateSwatches({
        hue,
        chroma: 0.4,
        lightest: 0.99,
        middle: 0.7,
        darkest: 0.08,
      })

      for (const swatch of swatches) {
        expect(swatch.hex).toMatch(HEX_PATTERN)
        expect(swatch.chroma).toBeGreaterThanOrEqual(0)
        expect(swatch.chroma).toBeLessThanOrEqual(0.4)
      }
    }
  })

  it('produces neutral grays when chroma is zero', () => {
    const swatches = generateSwatches({
      hue: 140,
      chroma: 0,
      lightest: LIGHTEST,
      middle: MIDDLE,
      darkest: DARKEST,
    })

    for (const swatch of swatches) {
      const red = swatch.hex.slice(1, 3)
      const green = swatch.hex.slice(3, 5)
      const blue = swatch.hex.slice(5, 7)
      expect(green).toBe(red)
      expect(blue).toBe(red)
    }
  })

  it('tapers chroma toward the light and dark ends', () => {
    const swatches = generateSwatches({
      hue: 220,
      chroma: 0.1,
      lightest: LIGHTEST,
      middle: MIDDLE,
      darkest: DARKEST,
    })
    const midChroma = swatches[5].chroma

    expect(swatches[0].chroma).toBeLessThan(midChroma)
    expect(swatches[9].chroma).toBeLessThan(midChroma)
  })

  it('changes the mid shade when hue changes', () => {
    const blue = generateSwatches({
      hue: 240,
      chroma: 0.14,
      lightest: LIGHTEST,
      middle: MIDDLE,
      darkest: DARKEST,
    })[5]
    const orange = generateSwatches({
      hue: 55,
      chroma: 0.14,
      lightest: LIGHTEST,
      middle: MIDDLE,
      darkest: DARKEST,
    })[5]
    expect(blue.hex).not.toBe(orange.hex)
  })
})
