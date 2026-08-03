export function Spinner({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-8 text-brand-text/60" role="status">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-brand-secondary border-t-brand-primary"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  )
}
