import type { FormEvent } from 'react'
import type { PaletteDraft } from '../types'
import {
  DEFAULT_VALUES,
  LIMITS,
  clampValue,
  normalizeHue,
} from '../lib/color'
import { MAX_NAME_LENGTH } from '../lib/palette'
import { PlusIcon, SaveIcon } from './icons'
import { RangeField } from './RangeField'

interface Feedback {
  type: 'success' | 'error'
  text: string
}

interface PaletteEditorProps {
  draft: PaletteDraft
  editingName: string | null
  feedback: Feedback | null
  onChange: (patch: Partial<PaletteDraft>) => void
  onSave: () => void
  onNew: () => void
}

const HUE_GRADIENT =
  'linear-gradient(90deg, #ff6b6b 0%, #f6c453 17%, #7ec96f 34%, #49c7bd 50%, #5b9cff 67%, #9a74f5 84%, #ff6b6b 100%)'

export function PaletteEditor({
  draft,
  editingName,
  feedback,
  onChange,
  onSave,
  onNew,
}: PaletteEditorProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave()
  }

  const hue = normalizeHue(draft.hue)
  const chromaGradient = `linear-gradient(90deg, oklch(0.72 0 ${hue}), oklch(0.72 ${LIMITS.chroma.max} ${hue}))`
  const middleMin = Math.max(LIMITS.middle.min, draft.darkest + 0.005)
  const middleMax = Math.min(LIMITS.middle.max, draft.lightest - 0.005)

  return (
    <form
      className={`card editor-card${editingName ? ' editor-card--editing' : ''}`}
      id="palette-editor"
      onSubmit={handleSubmit}
    >
      <div className="card-heading">
        <div>
          <p className="eyebrow">Palette editor</p>
          <h2>{editingName ? `Editing ${editingName}` : 'Create a palette'}</h2>
        </div>
        {editingName ? (
          <button className="ghost-button" type="button" onClick={onNew}>
            <PlusIcon className="icon" />
            New
          </button>
        ) : null}
      </div>

      <div className="name-field">
        <label htmlFor="palette-name">Color name</label>
        <input
          id="palette-name"
          type="text"
          value={draft.name}
          maxLength={MAX_NAME_LENGTH}
          placeholder="e.g. Ocean blue"
          autoComplete="off"
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>

      <div className="fields">
        <RangeField
          className="field--hue"
          label="Hue"
          value={draft.hue}
          min={LIMITS.hue.min}
          max={LIMITS.hue.max}
          step={LIMITS.hue.step}
          suffix="°"
          hint="0–360°"
          description="Sets the base hue of the palette in OKLCH degrees. 0° and 360° meet at red. Light and dark shades shift slightly to follow the reference."
          gradient={HUE_GRADIENT}
          onChange={(hue) => onChange({ hue })}
        />
        <RangeField
          className="field--chroma"
          label="Chroma"
          value={draft.chroma}
          min={LIMITS.chroma.min}
          max={LIMITS.chroma.max}
          step={LIMITS.chroma.step}
          hint="0–0.4"
          description="Controls color intensity at shade 500. Lighter and darker shades taper automatically; out-of-gamut colors lose chroma to stay displayable in sRGB."
          gradient={chromaGradient}
          onChange={(chroma) => onChange({ chroma })}
        />
        <RangeField
          className="field--lightest"
          label="Lightest shade"
          value={draft.lightest}
          min={LIMITS.lightest.min}
          max={LIMITS.lightest.max}
          step={LIMITS.lightest.step}
          hint="90–99% L"
          description="OKLCH lightness of shade 50. Closer to 1 is closer to white; the 0.99 limit keeps shade 50 distinguishable."
          onChange={(lightest) =>
            onChange({
              lightest,
              middle: clampValue(
                draft.middle,
                draft.darkest + 0.005,
                lightest - 0.005,
              ),
            })
          }
        />
        <RangeField
          className="field--middle"
          label="Shade 500"
          value={draft.middle}
          min={middleMin}
          max={middleMax}
          step={LIMITS.middle.step}
          hint="8–99% L"
          description="OKLCH lightness of shade 500. This is the primary ramp control; shades 50–400 and 600–900 interpolate from it toward the lightness endpoints."
          onChange={(middle) => onChange({ middle })}
        />
        <RangeField
          className="field--darkest"
          label="Darkest shade"
          value={draft.darkest}
          min={LIMITS.darkest.min}
          max={LIMITS.darkest.max}
          step={LIMITS.darkest.step}
          hint="8–80% L"
          description="OKLCH lightness of shade 900. Brighter palettes can keep a lighter darkest shade; the 0.08 limit keeps shade 900 distinguishable from black."
          onChange={(darkest) =>
            onChange({
              darkest,
              middle: clampValue(
                draft.middle,
                darkest + 0.005,
                draft.lightest - 0.005,
              ),
            })
          }
        />
      </div>

      <div className="editor-actions">
        <button className="primary-button" type="submit">
          <SaveIcon className="icon" />
          Save palette
        </button>
        <button
          className="text-button"
          type="button"
          onClick={() => onChange(DEFAULT_VALUES)}
        >
          Reset values
        </button>
      </div>

      {feedback ? (
        <p
          className={`feedback feedback--${feedback.type}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.text}
        </p>
      ) : null}
    </form>
  )
}
