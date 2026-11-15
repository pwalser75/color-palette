interface IconProps {
  className?: string
}

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
    </svg>
  )
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5a8.5 8.5 0 1 0 10.9 10.9Z" />
    </svg>
  )
}

export function GripIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className} strokeWidth={0} fill="currentColor">
      <circle cx="9" cy="6" r="1.35" />
      <circle cx="15" cy="6" r="1.35" />
      <circle cx="9" cy="12" r="1.35" />
      <circle cx="15" cy="12" r="1.35" />
      <circle cx="9" cy="18" r="1.35" />
      <circle cx="15" cy="18" r="1.35" />
    </svg>
  )
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
      <path d="m13.8 6.4 3 3" />
    </svg>
  )
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M4 7h16M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function ImageIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 5-5 4 4 3-3 4 4" />
    </svg>
  )
}

export function CodeIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="m8 9-4 3 4 3M16 9l4 3-4 3" />
    </svg>
  )
}

export function SaveIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M5 4h11l3 3v13H5V4Z" />
      <path d="M8 4v5h7V4M8 20v-6h8v6" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  )
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="m6 14 6-6 6 6" />
    </svg>
  )
}

export function ArrowDownIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="m6 10 6 6 6-6" />
    </svg>
  )
}
