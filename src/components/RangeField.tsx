import { useEffect, useId, useRef, useState } from 'react'

interface RangeFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  hint?: string
  description?: string
  gradient?: string
  className?: string
  onChange: (value: number) => void
}

function decimalsForStep(step: number): number {
  if (step >= 1) {
    return 0
  }

  const decimals = String(step).split('.')[1]
  return decimals?.length ?? 2
}

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  hint,
  description,
  gradient,
  className,
  onChange,
}: RangeFieldProps) {
  const inputId = useId()
  const tooltipId = `${inputId}-tooltip`
  const decimals = decimalsForStep(step)
  const formatValue = (next: number) => next.toFixed(decimals)
  const [text, setText] = useState(() => formatValue(value))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) {
      setText(value.toFixed(decimals))
    }
  }, [value, decimals])

  const commit = (raw: string) => {
    setText(raw)
    const parsed = Number(raw)

    if (raw.trim() !== '' && Number.isFinite(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)))
    }
  }

  const finishEditing = () => {
    focusedRef.current = false
    const parsed = Number(text)

    if (text.trim() === '' || !Number.isFinite(parsed)) {
      setText(formatValue(value))
      return
    }

    const next = Math.min(max, Math.max(min, parsed))
    onChange(next)
    setText(formatValue(next))
  }

  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <div className="field-head">
        <span className="field-label">
          <label htmlFor={`${inputId}-range`}>{label}</label>
          {description ? (
            <span className="tooltip-anchor">
              <button
                className="info-button"
                type="button"
                aria-label={`About ${label}`}
                aria-describedby={tooltipId}
              >
                ?
              </button>
              <span id={tooltipId} className="tooltip-bubble" role="tooltip">
                {description}
              </span>
            </span>
          ) : null}
        </span>
        <span className="field-range">
          {hint ?? `${min}–${max}${suffix ?? ''}`}
        </span>
      </div>
      <div className="field-row">
        <input
          id={`${inputId}-range`}
          className="range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, value))}
          style={gradient ? { background: gradient } : undefined}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <label className="number-control">
          <span className="sr-only">{`${label} value`}</span>
          <input
            type="text"
            inputMode="decimal"
            value={text}
            spellCheck={false}
            autoComplete="off"
            onFocus={() => {
              focusedRef.current = true
            }}
            onChange={(event) => commit(event.target.value)}
            onBlur={finishEditing}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }
            }}
          />
          {suffix ? <span className="number-suffix">{suffix}</span> : null}
        </label>
      </div>
    </div>
  )
}
