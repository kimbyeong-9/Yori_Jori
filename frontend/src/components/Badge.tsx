import type { ReactNode } from 'react'

type Tone = 'primary' | 'secondary' | 'accent' | 'neutral'

const TONE_CLASSES: Record<Tone, string> = {
  primary: 'bg-brand-primary/10 text-brand-primary',
  secondary: 'bg-brand-secondary/40 text-brand-text',
  accent: 'bg-brand-accent/60 text-brand-text',
  neutral: 'bg-brand-text/10 text-brand-text',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  )
}
