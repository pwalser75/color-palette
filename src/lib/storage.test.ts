import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Palette } from '../types'
import {
  decodePalettes,
  encodePalettes,
  loadInitialPalettes,
  loadPalettesFromStorage,
  loadTheme,
  readPalettesFromUrl,
  savePalettesToStorage,
  saveTheme,
  writePalettesToUrl,
} from './storage'

const palette: Palette = {
  id: 'palette-one',
  name: 'Océan bleu',
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

let data: Map<string, string>

function createStorage() {
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    clear: () => {
      data.clear()
    },
    key: () => null,
    get length() {
      return data.size
    },
  }
}

beforeEach(() => {
  data = new Map()
  vi.stubGlobal('window', { localStorage: createStorage() })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('palette URL encoding', () => {
  it('round-trips names with unicode and preserves order', () => {
    const palettes = [palette, { ...palette, id: 'two', name: 'Amber glow' }]
    const decoded = decodePalettes(encodePalettes(palettes))

    expect(decoded?.map((item) => item.name)).toEqual([
      'Océan bleu',
      'Amber glow',
    ])
    expect(decoded?.[0].hue).toBe(220)
    expect(decoded?.[1].id).not.toBe(decoded?.[0].id)
  })

  it('uses URL-safe base64 characters', () => {
    const encoded = encodePalettes([palette])
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('round-trips names containing commas', () => {
    const decoded = decodePalettes(
      encodePalettes([{ ...palette, name: 'Ocean, blue' }]),
    )

    expect(decoded?.[0].name).toBe('Ocean, blue')
  })

  it('decodes legacy four-value tuples by mapping gamma to the middle shade', () => {
    const legacyJson = JSON.stringify([['Legacy', 220, 0.12, 1.3]])
    const encoded = btoa(legacyJson)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')

    const decoded = decodePalettes(encoded)

    expect(decoded).toHaveLength(1)
    expect(decoded?.[0].lightest).toBe(0.97)
    expect(decoded?.[0].darkest).toBe(0.22)
    expect(decoded?.[0].shade500).toBeCloseTo(0.541, 2)
    expect(decoded?.[0].lightestChromaBoost).toBe(0.15)
    expect(decoded?.[0].darkestChromaBoost).toBe(0.8)
  })

  it('decodes legacy five-value CSV lines', () => {
    const legacyCsv = '220,0.12,0.97,0.55,0.22,Legacy'
    const encoded = btoa(legacyCsv)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')

    const decoded = decodePalettes(encoded)

    expect(decoded).toHaveLength(1)
    expect(decoded?.[0].name).toBe('Legacy')
    expect(decoded?.[0].shade500).toBe(0.55)
    expect(decoded?.[0].lightest).toBe(0.97)
    expect(decoded?.[0].darkest).toBe(0.22)
    expect(decoded?.[0].lightestChromaBoost).toBe(0.15)
    expect(decoded?.[0].lightestHueShift).toBe(0)
    expect(decoded?.[0].darkestChromaBoost).toBe(0.8)
    expect(decoded?.[0].darkestHueShift).toBe(0)
  })

  it('returns null for invalid encoding or payloads', () => {
    expect(decodePalettes('not base64!')).toBeNull()
    expect(decodePalettes('bm90IGpzb24')).toBeNull()
    expect(decodePalettes('W10')).toEqual([])
  })
})

describe('local storage', () => {
  it('persists and restores palettes', () => {
    savePalettesToStorage([palette])
    const restored = loadPalettesFromStorage()

    expect(restored).toHaveLength(1)
    expect(restored?.[0].name).toBe(palette.name)
    expect(restored?.[0].id).toBe(palette.id)
  })

  it('returns null for malformed stored data', () => {
    window.localStorage.setItem('idx-color-palette:palettes:v1', '{broken')
    expect(loadPalettesFromStorage()).toBeNull()
  })

  it('migrates legacy stored objects with gamma', () => {
    window.localStorage.setItem(
      'idx-color-palette:palettes:v1',
      JSON.stringify([
        {
          id: 'legacy',
          name: 'Legacy',
          hue: 30,
          chroma: 0.2,
          gamma: 2,
        },
      ]),
    )

    const restored = loadPalettesFromStorage()

    expect(restored?.[0].lightest).toBe(0.97)
    expect(restored?.[0].darkest).toBe(0.22)
    expect(restored?.[0].shade500).toBeCloseTo(0.513, 2)
    expect(restored?.[0].lightestChromaBoost).toBe(0.15)
    expect(restored?.[0].darkestChromaBoost).toBe(0.8)
  })

  it('defaults to light mode and persists dark mode', () => {
    expect(loadTheme()).toBe('light')
    saveTheme('dark')
    expect(loadTheme()).toBe('dark')
  })
})

describe('initial load', () => {
  function stubWindow(search = '') {
    vi.stubGlobal('window', {
      localStorage: createStorage(),
      location: {
        href: `https://example.com/app/${search}`,
        search,
      },
      history: { replaceState: vi.fn() },
    })
  }

  it('seeds the built-in palettes when no URL or stored state exists', () => {
    stubWindow()
    const initial = loadInitialPalettes()

    expect(initial).toHaveLength(16)
    expect(initial[0].name).toBe('Red')
    expect(initial[15].name).toBe('Warm Gray')
  })

  it('keeps an explicitly empty stored list empty', () => {
    stubWindow()
    savePalettesToStorage([])

    expect(loadInitialPalettes()).toEqual([])
  })

  it('re-seeds defaults for legacy empty storage without the initialized marker', () => {
    stubWindow()
    window.localStorage.setItem('idx-color-palette:palettes:v1', '[]')

    const initial = loadInitialPalettes()

    expect(initial).toHaveLength(16)
    expect(initial[0].name).toBe('Red')
  })

  it('restores an empty URL palette list when running from a local file', () => {
    const encoded = encodePalettes([])
    vi.stubGlobal('window', {
      localStorage: createStorage(),
      location: {
        href: `file:///app/index.html?palettes=${encoded}`,
        search: `?palettes=${encoded}`,
        protocol: 'file:',
      },
      history: { replaceState: vi.fn() },
    })

    expect(loadInitialPalettes()).toEqual([])
  })

  it('prefers a URL palette list over stored data', () => {
    stubWindow()
    savePalettesToStorage([{ ...palette, name: 'Stored palette' }])
    const encoded = encodePalettes([{ ...palette, name: 'URL palette' }])

    vi.stubGlobal('window', {
      localStorage: createStorage(),
      location: {
        href: `https://example.com/app/?palettes=${encoded}`,
        search: `?palettes=${encoded}`,
      },
      history: { replaceState: vi.fn() },
    })

    expect(loadInitialPalettes()[0].name).toBe('URL palette')
  })
})

describe('URL state', () => {
  it('reads palettes from the query parameter', () => {
    const encoded = encodePalettes([palette])
    vi.stubGlobal('window', {
      localStorage: createStorage(),
      location: {
        href: `https://example.com/app/?palettes=${encoded}`,
        search: `?palettes=${encoded}`,
      },
      history: { replaceState: vi.fn() },
    })

    expect(readPalettesFromUrl()?.[0].name).toBe(palette.name)
  })

  it('writes URL state when the app runs from a local file', () => {
    const replaceState = vi.fn()
    vi.stubGlobal('window', {
      localStorage: createStorage(),
      location: {
        href: 'file:///app/index.html',
        search: '',
        protocol: 'file:',
      },
      history: { replaceState },
    })

    writePalettesToUrl([palette])

    expect(replaceState).toHaveBeenCalledTimes(1)
    const writtenUrl = replaceState.mock.calls[0][2] as URL
    expect(
      decodePalettes(writtenUrl.searchParams.get('palettes') ?? ''),
    ).toEqual([expect.objectContaining({ name: palette.name })])
  })

  it('writes palettes and removes the parameter for an empty list', () => {
    const replaceState = vi.fn()
    vi.stubGlobal('window', {
      localStorage: createStorage(),
      location: {
        href: 'https://example.com/app/',
        search: '',
      },
      history: { replaceState },
    })

    writePalettesToUrl([palette])
    const writtenUrl = replaceState.mock.calls[0][2] as URL
    expect(decodePalettes(writtenUrl.searchParams.get('palettes') ?? '')).toEqual(
      [expect.objectContaining({ name: palette.name })],
    )

    replaceState.mockClear()
    writePalettesToUrl([])
    const emptyUrl = replaceState.mock.calls[0][2] as URL
    expect(emptyUrl.searchParams.has('palettes')).toBe(false)
  })
})
