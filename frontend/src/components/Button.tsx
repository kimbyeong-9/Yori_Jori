import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-primary text-white hover:opacity-90 disabled:opacity-50',
  secondary: 'bg-brand-secondary text-brand-text hover:opacity-90 disabled:opacity-50',
  ghost: 'bg-transparent text-brand-text border border-brand-text/20 hover:bg-brand-text/5',
  danger: 'bg-transparent text-brand-primary border border-brand-primary/40 hover:bg-brand-primary/5',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
