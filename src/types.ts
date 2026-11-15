export interface Palette {
  id: string
  name: string
  hue: number
  chroma: number
  lightest: number
  middle: number
  darkest: number
}

export interface PaletteDraft {
  name: string
  hue: number
  chroma: number
  lightest: number
  middle: number
  darkest: number
}

export interface Swatch {
  shade: number
  lightness: number
  chroma: number
  hex: string
}

export type Theme = 'light' | 'dark'
