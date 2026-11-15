import type { Swatch } from '../types'

interface SwatchStripProps {
  swatches: Swatch[]
  compact?: boolean
  label?: string
  onCopy: (hex: string) => void
}

export function SwatchStrip({
  swatches,
  compact,
  label,
  onCopy,
}: SwatchStripProps) {
  return (
    <div
      className={`swatch-strip${compact ? ' swatch-strip--compact' : ''}`}
      role="group"
      aria-label={label ?? 'Color palette shades'}
    >
      {swatches.map((swatch) => {
        const lightness = Math.round(swatch.lightness * 100)

        return (
          <button
            className="swatch"
            type="button"
            key={swatch.shade}
            title={`Copy ${swatch.hex}`}
            aria-label={`Copy ${swatch.hex}, shade ${swatch.shade}, lightness ${lightness} percent`}
            onClick={() => onCopy(swatch.hex)}
          >
            <span
              className="swatch-color"
              style={{ backgroundColor: swatch.hex }}
            />
            <span className="swatch-meta" aria-hidden="true">
              <span className="swatch-shade">{swatch.shade}</span>
              <span className="swatch-lightness">L {lightness}%</span>
              <span className="swatch-hex">{swatch.hex}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
