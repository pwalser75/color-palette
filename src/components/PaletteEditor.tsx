import type { FormEvent } from 'react'
import type { PaletteDraft } from '../types'
import { LIMITS, clampValue, normalizeHue } from '../lib/color'
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
  onReset: () => void
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
  onReset,
}: PaletteEditorProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave()
  }

  const hue = normalizeHue(draft.hue)
  const chromaGradient = `linear-gradient(90deg, oklch(0.72 0 ${hue}), oklch(0.72 ${LIMITS.chroma.max} ${hue}))`
  const shade500Min = Math.max(LIMITS.shade500.min, draft.darkest + 0.005)
  const shade500Max = Math.min(LIMITS.shade500.max, draft.lightest - 0.005)

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
          placeholder="Color name"
          aria-label="Color name"
          autoComplete="off"
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>

      <div className="fields">
        <div
          className="field-group"
          role="group"
          aria-labelledby="base-group-title"
        >
          <p className="field-group-title" id="base-group-title">
            Base color
          </p>
          <div className="field-group-fields">
            <RangeField
              className="field--hue"
              label="Hue"
              value={draft.hue}
              min={LIMITS.hue.min}
              max={LIMITS.hue.max}
              step={LIMITS.hue.step}
              suffix="°"
              hint="0–360°"
              description="Sets the base hue of the palette in OKLCH degrees. Shade 500 uses this hue, while the lightest and darkest ends apply their own hue shifts."
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
              description="Controls color intensity at shade 500. The lightest and darkest extremes scale this base chroma with their own boost factors; out-of-gamut colors lose chroma to stay displayable in sRGB."
              gradient={chromaGradient}
              onChange={(chroma) => onChange({ chroma })}
            />
            <RangeField
              className="field--shade500"
              label="Shade 500 lightness"
              value={draft.shade500}
              min={shade500Min}
              max={shade500Max}
              step={LIMITS.shade500.step}
              hint="8–99% L"
              description="OKLCH lightness of shade 500. This is the primary ramp control; shades 50–400 and 600–900 interpolate from it toward the lightness endpoints."
              onChange={(shade500) => onChange({ shade500 })}
            />
          </div>
        </div>

        <div
          className="field-group"
          role="group"
          aria-labelledby="lightest-group-title"
        >
          <p className="field-group-title" id="lightest-group-title">
            Lightest shade · 50
          </p>
          <div className="field-group-fields">
            <RangeField
              className="field--endpoint"
              label="Hue shift"
              value={draft.lightestHueShift}
              min={LIMITS.lightestHueShift.min}
              max={LIMITS.lightestHueShift.max}
              step={LIMITS.lightestHueShift.step}
              suffix="°"
              hint="−45–45°"
              description="Rotates the hue at shade 50 relative to the base hue. Negative values turn counter-clockwise; positive values turn clockwise."
              onChange={(lightestHueShift) => onChange({ lightestHueShift })}
            />
            <RangeField
              className="field--endpoint"
              label="Chroma boost"
              value={draft.lightestChromaBoost}
              min={LIMITS.lightestChromaBoost.min}
              max={LIMITS.lightestChromaBoost.max}
              step={LIMITS.lightestChromaBoost.step}
              suffix="×"
              hint="0–5×"
              description="Multiplies the base chroma at shade 50. 0 produces a neutral light shade, 1 matches the shade 500 chroma and higher values push past it."
              onChange={(lightestChromaBoost) =>
                onChange({ lightestChromaBoost })
              }
            />
            <RangeField
              className="field--endpoint"
              label="Lightness"
              value={draft.lightest}
              min={LIMITS.lightest.min}
              max={LIMITS.lightest.max}
              step={LIMITS.lightest.step}
              hint="90–99% L"
              description="OKLCH lightness of shade 50. Closer to 1 is closer to white; the 0.99 limit keeps shade 50 distinguishable."
              onChange={(lightest) =>
                onChange({
                  lightest,
                  shade500: clampValue(
                    draft.shade500,
                    draft.darkest + 0.005,
                    lightest - 0.005,
                  ),
                })
              }
            />
          </div>
        </div>

        <div
          className="field-group"
          role="group"
          aria-labelledby="darkest-group-title"
        >
          <p className="field-group-title" id="darkest-group-title">
            Darkest shade · 900
          </p>
          <div className="field-group-fields">
            <RangeField
              className="field--endpoint"
              label="Hue shift"
              value={draft.darkestHueShift}
              min={LIMITS.darkestHueShift.min}
              max={LIMITS.darkestHueShift.max}
              step={LIMITS.darkestHueShift.step}
              suffix="°"
              hint="−45–45°"
              description="Rotates the hue at shade 900 relative to the base hue. Negative values turn counter-clockwise; positive values turn clockwise."
              onChange={(darkestHueShift) => onChange({ darkestHueShift })}
            />
            <RangeField
              className="field--endpoint"
              label="Chroma boost"
              value={draft.darkestChromaBoost}
              min={LIMITS.darkestChromaBoost.min}
              max={LIMITS.darkestChromaBoost.max}
              step={LIMITS.darkestChromaBoost.step}
              suffix="×"
              hint="0–5×"
              description="Multiplies the base chroma at shade 900. 0 produces a neutral dark shade, 1 matches the shade 500 chroma and higher values push past it."
              onChange={(darkestChromaBoost) =>
                onChange({ darkestChromaBoost })
              }
            />
            <RangeField
              className="field--endpoint"
              label="Lightness"
              value={draft.darkest}
              min={LIMITS.darkest.min}
              max={LIMITS.darkest.max}
              step={LIMITS.darkest.step}
              hint="8–80% L"
              description="OKLCH lightness of shade 900. Brighter palettes can keep a lighter darkest shade; the 0.08 limit keeps shade 900 distinguishable from black."
              onChange={(darkest) =>
                onChange({
                  darkest,
                  shade500: clampValue(
                    draft.shade500,
                    darkest + 0.005,
                    draft.lightest - 0.005,
                  ),
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="editor-actions">
        <button className="primary-button" type="submit">
          <SaveIcon className="icon" />
          Save palette
        </button>
        <button className="text-button" type="button" onClick={onReset}>
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
