import { describe, expect, it } from 'vitest'
import type { Palette } from '../types'
import { generateSwatches } from './color'
import { buildPaletteCss, buildPaletteSvg } from './export'

function makePalette(
  name: string,
  overrides: Partial<Palette> = {},
): Palette {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
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

describe('buildPaletteSvg', () => {
  it('renders every palette, shade and hex value', () => {
    const palettes = [
      makePalette('Ocean'),
      makePalette('Amber', { hue: 55, chroma: 0.16 }),
    ]
    const svg = buildPaletteSvg(palettes)
    const oceanSwatches = generateSwatches(palettes[0])

    expect(svg).toContain('<svg')
    expect(svg).toContain('width="780"')
    expect(svg).toContain('height="300"')
    expect(svg).toContain('>Ocean</text>')
    expect(svg).toContain('>Amber</text>')
    expect(svg).toContain(`fill="${oceanSwatches[0].hex}"`)
    expect(svg).toContain(`>${oceanSwatches[0].shade}</text>`)
    expect(svg).toContain(`>${oceanSwatches[0].hex}</text>`)
  })

  it('escapes XML-sensitive characters in names', () => {
    const svg = buildPaletteSvg([makePalette('A & B')])

    expect(svg).toContain('A &amp; B')
  })
})

describe('buildPaletteCss', () => {
  it('writes CSS custom properties for every shade', () => {
    const palette = makePalette('Ocean')
    const css = buildPaletteCss([palette])
    const swatches = generateSwatches(palette)

    expect(css).toContain(':root {')
    expect(css).toContain('/* Ocean')
    expect(css).toContain(
      `--color-ocean-${swatches[0].shade}: ${swatches[0].hex};`,
    )
    expect(css).toContain(
      `--color-ocean-${swatches[9].shade}: ${swatches[9].hex};`,
    )
  })

  it('creates unique slugs for colliding palette names', () => {
    const css = buildPaletteCss([
      makePalette('A B'),
      makePalette('A-B', { hue: 30 }),
    ])

    expect(css).toContain('--color-a-b-50:')
    expect(css).toContain('--color-a-b-2-50:')
  })
})
