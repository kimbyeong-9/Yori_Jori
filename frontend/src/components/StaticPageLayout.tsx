import type { ReactNode } from 'react'

interface StaticPageLayoutProps {
  title: string
  children: ReactNode
}

export function StaticPageLayout({ title, children }: StaticPageLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <h1 className="mb-8 text-center text-3xl font-bold text-brand-text">{title}</h1>
      <div className="flex flex-col gap-6 rounded-2xl border border-brand-text/10 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
