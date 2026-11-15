import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import type { Palette } from '../types'
import { generateSwatches } from '../lib/color'
import { movePaletteBy } from '../lib/palette'
import { GripIcon, PencilIcon, TrashIcon } from './icons'
import { SwatchStrip } from './SwatchStrip'

interface PaletteListProps {
  palettes: Palette[]
  onEdit: (palette: Palette) => void
  onDelete: (palette: Palette) => void
  onReorder: (palettes: Palette[]) => void
  onCopy: (hex: string) => void
}

interface PaletteRowProps {
  palette: Palette
  dragging: boolean
  onDragStart: (event: PointerEvent<HTMLButtonElement>, id: string) => void
  onEdit: (palette: Palette) => void
  onDelete: (palette: Palette) => void
  onMove: (id: string, offset: number) => void
  onCopy: (hex: string) => void
}

function PaletteRow({
  palette,
  dragging,
  onDragStart,
  onEdit,
  onDelete,
  onMove,
  onCopy,
}: PaletteRowProps) {
  const swatches = useMemo(() => generateSwatches(palette), [palette])

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      onMove(palette.id, -1)
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      onMove(palette.id, 1)
    }
  }

  return (
    <article
      className={`palette-card${dragging ? ' palette-card--dragging' : ''}`}
      data-palette-id={palette.id}
    >
      <div className="palette-head">
        <button
          className="drag-handle"
          type="button"
          aria-label={`Reorder ${palette.name}. Drag, or use the up and down arrow keys.`}
          title="Drag to reorder"
          onPointerDown={(event) => onDragStart(event, palette.id)}
          onKeyDown={handleKeyDown}
        >
          <GripIcon className="icon" />
        </button>

        <div className="palette-title">
          <h3>{palette.name}</h3>
          <p>
            <span>H {Math.round(palette.hue)}°</span>
            <span>C {palette.chroma.toFixed(3)}</span>
            <span>L {Math.round(palette.lightest * 100)}/{Math.round(palette.middle * 100)}/{Math.round(palette.darkest * 100)}%</span>
          </p>
        </div>

        <div className="palette-actions">
          <button
            className="subtle-button"
            type="button"
            aria-label={`Edit ${palette.name}`}
            title="Edit palette"
            onClick={() => onEdit(palette)}
          >
            <PencilIcon className="icon" />
            <span className="subtle-button-label">Edit</span>
          </button>
          <button
            className="subtle-button subtle-button--danger"
            type="button"
            aria-label={`Delete ${palette.name}`}
            title="Delete palette"
            onClick={() => onDelete(palette)}
          >
            <TrashIcon className="icon" />
            <span className="subtle-button-label">Delete</span>
          </button>
        </div>
      </div>

      <SwatchStrip
        swatches={swatches}
        compact
        label={`${palette.name} shades`}
        onCopy={onCopy}
      />
    </article>
  )
}

export function PaletteList({
  palettes,
  onEdit,
  onDelete,
  onReorder,
  onCopy,
}: PaletteListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const palettesRef = useRef(palettes)
  const onReorderRef = useRef(onReorder)

  useEffect(() => {
    palettesRef.current = palettes
    onReorderRef.current = onReorder
  }, [palettes, onReorder])

  useEffect(() => {
    if (!draggingId) {
      return
    }

    document.body.classList.add('is-sorting')

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const current = palettesRef.current
      const dragged = current.find((palette) => palette.id === draggingId)

      if (!dragged) {
        return
      }

      const cards = Array.from(
        document.querySelectorAll<HTMLElement>('[data-palette-id]'),
      ).filter((card) => card.dataset.paletteId !== draggingId)

      let insertAt = cards.length

      for (let index = 0; index < cards.length; index += 1) {
        const rect = cards[index].getBoundingClientRect()

        if (event.clientY < rect.top + rect.height / 2) {
          insertAt = index
          break
        }
      }

      const next = current.filter((palette) => palette.id !== draggingId)
      next.splice(insertAt, 0, dragged)

      if (next.some((palette, index) => palette.id !== current[index].id)) {
        palettesRef.current = next
        onReorderRef.current(next)
      }
    }

    const stopDragging = () => setDraggingId(null)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      document.body.classList.remove('is-sorting')
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [draggingId])

  const handleDragStart = (
    event: PointerEvent<HTMLButtonElement>,
    id: string,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraggingId(id)
  }

  const handleMove = (id: string, offset: number) => {
    onReorder(movePaletteBy(palettes, id, offset))
  }

  return (
    <div className="palette-list">
      {palettes.map((palette) => (
        <PaletteRow
          key={palette.id}
          palette={palette}
          dragging={draggingId === palette.id}
          onDragStart={handleDragStart}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={handleMove}
          onCopy={onCopy}
        />
      ))}
    </div>
  )
}
