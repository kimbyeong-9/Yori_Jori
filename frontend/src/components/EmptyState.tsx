import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-brand-text/20 p-8 text-center">
      <p className="font-medium text-brand-text">{title}</p>
      {description && <p className="text-sm text-brand-text/60">{description}</p>}
      {action}
    </div>
  )
}
