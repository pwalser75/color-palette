import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Palette, PaletteDraft, Theme } from './types'
import { DEFAULT_VALUES, generateSwatches } from './lib/color'
import { copyText } from './lib/clipboard'
import { createDefaultPalettes } from './lib/defaultPalettes'
import {
  buildPaletteCss,
  buildPaletteSvg,
  openExportTab,
} from './lib/export'
import { savePalette } from './lib/palette'
import {
  loadInitialPalettes,
  loadTheme,
  savePalettesToStorage,
  saveTheme,
  writePalettesToUrl,
} from './lib/storage'
import { ConfirmDialog } from './components/ConfirmDialog'
import { PaletteEditor } from './components/PaletteEditor'
import { PaletteList } from './components/PaletteList'
import { SwatchStrip } from './components/SwatchStrip'
import {
  CheckIcon,
  CodeIcon,
  ImageIcon,
  TrashIcon,
} from './components/icons'
import { ThemeToggle } from './components/ThemeToggle'

interface Feedback {
  type: 'success' | 'error'
  text: string
}

interface Toast {
  id: number
  text: string
}

type PendingAction =
  | { type: 'delete'; palette: Palette }
  | { type: 'remove-all' }

function createDefaultDraft(): PaletteDraft {
  return { name: '', ...DEFAULT_VALUES }
}

function paletteToDraft(palette: Palette): PaletteDraft {
  return {
    name: palette.name,
    hue: palette.hue,
    chroma: palette.chroma,
    shade500: palette.shade500,
    lightest: palette.lightest,
    lightestChromaBoost: palette.lightestChromaBoost,
    lightestHueShift: palette.lightestHueShift,
    darkest: palette.darkest,
    darkestChromaBoost: palette.darkestChromaBoost,
    darkestHueShift: palette.darkestHueShift,
  }
}

export default function App() {
  const [palettes, setPalettes] = useState<Palette[]>(loadInitialPalettes)
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [draft, setDraft] = useState<PaletteDraft>(createDefaultDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastCounter = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveTheme(theme)

    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )
    if (meta) {
      meta.content = theme === 'light' ? '#f6f5f2' : '#111110'
    }
  }, [theme])

  useEffect(() => {
    savePalettesToStorage(palettes)
    const timer = window.setTimeout(() => writePalettesToUrl(palettes), 200)
    return () => window.clearTimeout(timer)
  }, [palettes])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timer = window.setTimeout(() => setFeedback(null), 3600)
    return () => window.clearTimeout(timer)
  }, [feedback])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const previewSwatches = useMemo(() => generateSwatches(draft), [draft])
  const previewName = draft.name.trim() || 'Untitled palette'
  const editingName = editingId
    ? (palettes.find((palette) => palette.id === editingId)?.name ?? null)
    : null

  const handleCopy = async (hex: string) => {
    const copied = await copyText(hex)
    toastCounter.current += 1
    setToast({
      id: toastCounter.current,
      text: copied ? `Copied ${hex}` : 'Could not copy to clipboard',
    })
  }

  const handleExportSvg = () => {
    openExportTab(
      buildPaletteSvg(palettes),
      'image/svg+xml;charset=utf-8',
    )
  }

  const handleExportCss = () => {
    openExportTab(
      buildPaletteCss(palettes),
      'text/css;charset=utf-8',
    )
  }

  const handleDraftChange = (patch: Partial<PaletteDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setFeedback(null)
  }

  const handleResetValues = () => {
    const stored = editingId
      ? palettes.find((palette) => palette.id === editingId)
      : undefined

    if (stored) {
      setDraft((current) => ({
        ...paletteToDraft(stored),
        name: current.name,
      }))
      setFeedback(null)
      return
    }

    handleDraftChange(DEFAULT_VALUES)
  }

  const handleSave = () => {
    const result = savePalette(palettes, draft)

    if (!result) {
      setFeedback({
        type: 'error',
        text: 'Give your palette a name before saving.',
      })
      return
    }

    setPalettes(result.palettes)
    setDraft(paletteToDraft(result.saved))
    setEditingId(result.saved.id)
    setFeedback({
      type: 'success',
      text: result.overwritten
        ? `Updated “${result.saved.name}”.`
        : `Saved “${result.saved.name}”.`,
    })
  }

  const handleNew = () => {
    setDraft(createDefaultDraft())
    setEditingId(null)
    setFeedback(null)
    window.requestAnimationFrame(() => {
      document.getElementById('palette-name')?.focus()
    })
  }

  const handleEdit = (palette: Palette) => {
    setDraft(paletteToDraft(palette))
    setEditingId(palette.id)
    setFeedback(null)
    window.requestAnimationFrame(() => {
      document
        .getElementById('palette-editor')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleRestoreDefaults = () => {
    setPalettes(createDefaultPalettes())
    setEditingId(null)
    setDraft(createDefaultDraft())
    setFeedback({
      type: 'success',
      text: 'Restored the default palettes.',
    })
  }

  const closeDialog = useCallback(() => {
    setPendingAction(null)
  }, [])

  const confirmAction = () => {
    if (!pendingAction) {
      return
    }

    if (pendingAction.type === 'delete') {
      const { palette } = pendingAction

      setPalettes((current) =>
        current.filter((item) => item.id !== palette.id),
      )

      if (editingId === palette.id) {
        setEditingId(null)
        setDraft((current) => ({ ...current, name: '' }))
      }

      setFeedback({
        type: 'success',
        text: `Deleted “${palette.name}”.`,
      })
    } else {
      setPalettes([])
      setEditingId(null)
      setDraft(createDefaultDraft())
      setFeedback({
        type: 'success',
        text: 'Removed all palettes.',
      })
    }

    setPendingAction(null)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            idx
          </span>
          <span className="brand-name">Color systems</span>
        </div>
        <ThemeToggle
          theme={theme}
          onToggle={() =>
            setTheme((current) => (current === 'light' ? 'dark' : 'light'))
          }
        />
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">OKLCH palette studio</p>
          <h1>idx Color Palette Generator</h1>
          <p className="hero-copy">
            Turn a single hue and chroma into a ten-step OKLCH ramp, then shape
            how far it reaches from white and black and how the shades are
            distributed. Pick a name, tune the controls and watch the preview
            update live; save palettes to keep them in this browser, drag them
            into your preferred order, or share the page URL to hand the whole
            collection to someone else.
          </p>
        </section>

        <section className="workspace" aria-label="Palette workspace">
          <PaletteEditor
            draft={draft}
            editingName={editingName}
            feedback={feedback}
            onChange={handleDraftChange}
            onSave={handleSave}
            onNew={handleNew}
            onReset={handleResetValues}
          />

          <div className="card preview-card">
            <div className="card-heading preview-heading">
              <div>
                <p className="eyebrow">Live preview</p>
                <h2>{previewName}</h2>
              </div>
              <div className="value-chips" aria-label="Palette values">
                <span>H {Math.round(draft.hue)}°</span>
                <span>C {draft.chroma.toFixed(3)}</span>
                <span>L {Math.round(draft.lightest * 100)}/{Math.round(draft.shade500 * 100)}/{Math.round(draft.darkest * 100)}%</span>
                <span>50 C×{draft.lightestChromaBoost.toFixed(2)} H{draft.lightestHueShift >= 0 ? '+' : ''}{draft.lightestHueShift}°</span>
                <span>900 C×{draft.darkestChromaBoost.toFixed(2)} H{draft.darkestHueShift >= 0 ? '+' : ''}{draft.darkestHueShift}°</span>
              </div>
            </div>

            <SwatchStrip
              swatches={previewSwatches}
              label={`${previewName} preview`}
              onCopy={handleCopy}
            />
          </div>
        </section>

        <section className="palettes-section" aria-labelledby="palettes-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Collection</p>
              <h2 id="palettes-heading">Your palettes</h2>
            </div>
            <div className="section-heading-actions">
              <span className="count-pill">
                {palettes.length}{' '}
                {palettes.length === 1 ? 'palette' : 'palettes'}
              </span>
              {palettes.length > 0 ? (
                <>
                  <button
                    className="subtle-button"
                    type="button"
                    title="Open an SVG of all palettes in a new tab"
                    onClick={handleExportSvg}
                  >
                    <ImageIcon className="icon" />
                    SVG
                  </button>
                  <button
                    className="subtle-button"
                    type="button"
                    title="Open a CSS export of all palettes in a new tab"
                    onClick={handleExportCss}
                  >
                    <CodeIcon className="icon" />
                    CSS
                  </button>
                  <button
                    className="subtle-button subtle-button--danger"
                    type="button"
                    onClick={() => setPendingAction({ type: 'remove-all' })}
                  >
                    <TrashIcon className="icon" />
                    Remove all
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {palettes.length > 0 ? (
            <PaletteList
              palettes={palettes}
              onEdit={handleEdit}
              onDelete={(palette) =>
                setPendingAction({ type: 'delete', palette })
              }
              onReorder={setPalettes}
              onCopy={handleCopy}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-state-bars" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <h3>No palettes saved yet</h3>
              <p>
                Shape a palette above and save it to start your collection.
                Palettes are stored in this browser and encoded in the page URL
                for sharing.
              </p>
              <div className="empty-state-actions">
                <button
                  className="subtle-button"
                  type="button"
                  onClick={handleRestoreDefaults}
                >
                  Restore default palettes
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <span>Everything stays in your browser</span>
        <span aria-hidden="true">·</span>
        <span>OKLCH</span>
        <span aria-hidden="true">·</span>
        <span>sRGB gamut mapped</span>
      </footer>

      {toast ? (
        <div className="toast" role="status" aria-live="polite" key={toast.id}>
          <CheckIcon className="icon" />
          <span>{toast.text}</span>
        </div>
      ) : null}

      {pendingAction ? (
        <ConfirmDialog
          title={
            pendingAction.type === 'delete'
              ? 'Delete palette?'
              : 'Remove all palettes?'
          }
          description={
            pendingAction.type === 'delete' ? (
              <>
                <strong>{pendingAction.palette.name}</strong> will be removed
                from this browser and from the share URL. This cannot be undone.
              </>
            ) : (
              'All saved palettes will be removed from this browser and from the share URL. This cannot be undone.'
            )
          }
          confirmLabel={
            pendingAction.type === 'delete' ? 'Delete palette' : 'Remove all'
          }
          onCancel={closeDialog}
          onConfirm={confirmAction}
        />
      ) : null}
    </div>
  )
}
