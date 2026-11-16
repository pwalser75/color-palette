export interface PaletteValues {
  hue: number
  chroma: number
  shade500: number
  lightest: number
  lightestChromaBoost: number
  lightestHueShift: number
  darkest: number
  darkestChromaBoost: number
  darkestHueShift: number
}

export interface Palette extends PaletteValues {
  id: string
  name: string
}

export interface PaletteDraft extends PaletteValues {
  name: string
}

export interface Swatch {
  shade: number
  lightness: number
  chroma: number
  hex: string
}

export type Theme = 'light' | 'dark'
