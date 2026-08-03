export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-8 text-center"
    >
      <p className="text-sm text-brand-primary">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-brand-primary px-4 py-1.5 text-sm text-brand-primary hover:bg-brand-primary hover:text-white"
        >
          다시 시도
        </button>
      )}
    </div>
  )
}
