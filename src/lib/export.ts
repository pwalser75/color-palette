import type { Palette } from '../types'
import { generateSwatches } from './color'

const SVG_WIDTH = 780
const SVG_LEFT = 14
const SVG_TOP = 30
const SVG_BLOCK_HEIGHT = 140
const SVG_SWATCH_WIDTH = 68
const SVG_SWATCH_HEIGHT = 50
const SVG_SWATCH_GAP = 8
const SVG_BOTTOM_PADDING = 20

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildPaletteSvg(palettes: Palette[]): string {
  const height =
    SVG_BOTTOM_PADDING + palettes.length * SVG_BLOCK_HEIGHT
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${height}" viewBox="0 0 ${SVG_WIDTH} ${height}" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">`,
    `  <rect width="${SVG_WIDTH}" height="${height}" fill="#ffffff"/>`,
  ]

  palettes.forEach((palette, paletteIndex) => {
    const top = SVG_TOP + paletteIndex * SVG_BLOCK_HEIGHT
    const swatches = generateSwatches(palette)

    parts.push('  <g>')
    parts.push(
      `    <text x="${SVG_LEFT}" y="${top}" font-size="20" font-weight="700" fill="#111827">${escapeXml(palette.name)}</text>`,
    )

    swatches.forEach((swatch, swatchIndex) => {
      const x =
        SVG_LEFT + swatchIndex * (SVG_SWATCH_WIDTH + SVG_SWATCH_GAP)
      const swatchY = top + 12

      parts.push(
        `    <rect x="${x}" y="${swatchY}" width="${SVG_SWATCH_WIDTH}" height="${SVG_SWATCH_HEIGHT}" rx="4" fill="${swatch.hex}"/>`,
      )
      parts.push(
        `    <text x="${x}" y="${top + 80}" font-size="13" font-weight="600" fill="#111827">${swatch.shade}</text>`,
      )
      parts.push(
        `    <text x="${x}" y="${top + 96}" font-size="13" fill="#6b7280">${swatch.hex}</text>`,
      )
    })

    parts.push('  </g>')
  })

  parts.push('</svg>')
  return parts.join('\n')
}

function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'palette'
}

function escapeCssComment(value: string): string {
  return value.replace(/\*\//g, '* /')
}

export function buildPaletteCss(palettes: Palette[]): string {
  const usedSlugs = new Set<string>()
  const lines: string[] = [
    '/* idx Color Palette Generator */',
    `/* Generated from ${palettes.length} palette${palettes.length === 1 ? '' : 's'}. */`,
    '',
    ':root {',
  ]

  palettes.forEach((palette, paletteIndex) => {
    const baseSlug = slugify(palette.name)
    let slug = baseSlug
    let suffix = 2

    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    usedSlugs.add(slug)

    if (paletteIndex > 0) {
      lines.push('')
    }

    lines.push(
      `  /* ${escapeCssComment(palette.name)} — hue ${Math.round(palette.hue)}°, chroma ${palette.chroma}, L ${Math.round(palette.lightest * 100)}/${Math.round(palette.shade500 * 100)}/${Math.round(palette.darkest * 100)}% */`,
    )

    for (const swatch of generateSwatches(palette)) {
      lines.push(`  --color-${slug}-${swatch.shade}: ${swatch.hex};`)
    }
  })

  lines.push('}')
  return lines.join('\n')
}

export function openExportTab(content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const tab = window.open(url, '_blank')

  if (!tab) {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener'
    document.body.append(link)
    link.click()
    link.remove()
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
