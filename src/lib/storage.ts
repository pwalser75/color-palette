import type { Palette, Theme } from '../types'
import { createDefaultPalettes } from './defaultPalettes'
import { sanitizePaletteList, serializePalettes } from './palette'

const PALETTES_STORAGE_KEY = 'idx-color-palette:palettes:v1'
const PALETTES_INITIALIZED_KEY = 'idx-color-palette:palettes-initialized:v1'
const THEME_STORAGE_KEY = 'idx-color-palette:theme:v1'
const PALETTES_URL_PARAM = 'palettes'

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padding = (4 - (normalized.length % 4)) % 4
    const binary = atob(normalized + '='.repeat(padding))
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

export function encodePalettes(palettes: Palette[]): string {
  return encodeBase64Url(serializePalettes(palettes))
}

function parseCsvLine(line: string): string[] | null {
  const fields: string[] = []
  let rest = line

  for (let index = 0; index < 5; index += 1) {
    const comma = rest.indexOf(',')
    if (comma < 0) {
      return null
    }

    fields.push(rest.slice(0, comma))
    rest = rest.slice(comma + 1)
  }

  fields.push(rest)
  return fields
}

export function decodePalettes(value: string): Palette[] | null {
  const text = decodeBase64Url(value)
  if (text === null) {
    return null
  }

  const trimmed = text.trim()

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      return sanitizePaletteList(JSON.parse(trimmed))
    } catch {
      return null
    }
  }

  const entries: unknown[] = []

  for (const line of text.split('\n')) {
    if (line.trim() === '') {
      continue
    }

    const fields = parseCsvLine(line.trim())
    if (!fields) {
      return null
    }

    const [hue, chroma, lightest, middle, darkest, name] = fields
    const numbers = [hue, chroma, lightest, middle, darkest]

    if (numbers.some((field) => field.trim() === '')) {
      return null
    }

    const [hueValue, chromaValue, lightestValue, middleValue, darkestValue] =
      numbers.map(Number)

    if (
      ![hueValue, chromaValue, lightestValue, middleValue, darkestValue].every(
        Number.isFinite,
      )
    ) {
      return null
    }

    entries.push({
      name,
      hue: hueValue,
      chroma: chromaValue,
      lightest: lightestValue,
      middle: middleValue,
      darkest: darkestValue,
    })
  }

  return sanitizePaletteList(entries)
}

export function loadPalettesFromStorage(): Palette[] | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(PALETTES_STORAGE_KEY)
    if (!raw) {
      return null
    }

    return sanitizePaletteList(JSON.parse(raw))
  } catch {
    return null
  }
}

export function savePalettesToStorage(palettes: Palette[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(palettes))
    window.localStorage.setItem(PALETTES_INITIALIZED_KEY, '1')
  } catch {
    return
  }
}

function hasInitializedStorage(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(PALETTES_INITIALIZED_KEY) === '1'
  } catch {
    return false
  }
}

export function loadTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
      ? 'dark'
      : 'light'
  } catch {
    return 'light'
  }
}

export function saveTheme(theme: Theme): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    return
  }
}

export function readPalettesFromUrl(): Palette[] | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = new URLSearchParams(window.location.search).get(
    PALETTES_URL_PARAM,
  )
  if (raw === null) {
    return null
  }

  return decodePalettes(raw)
}

export function writePalettesToUrl(palettes: Palette[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const url = new URL(window.location.href)

    if (palettes.length === 0) {
      url.searchParams.delete(PALETTES_URL_PARAM)
    } else {
      url.searchParams.set(PALETTES_URL_PARAM, encodePalettes(palettes))
    }

    window.history.replaceState(null, '', url)
  } catch {
    return
  }
}

export function loadInitialPalettes(): Palette[] {
  const fromUrl = readPalettesFromUrl()

  if (fromUrl) {
    return fromUrl
  }

  const stored = loadPalettesFromStorage()
  if (stored === null) {
    return createDefaultPalettes()
  }

  if (stored.length === 0 && !hasInitializedStorage()) {
    return createDefaultPalettes()
  }

  return stored
}
