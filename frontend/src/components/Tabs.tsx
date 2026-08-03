interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div role="tablist" className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === active}
          onClick={() => onChange(tab)}
          className={`whitespace-nowrap rounded-xl px-4 py-1.5 text-sm font-medium ${
            tab === active
              ? 'bg-brand-primary text-white'
              : 'bg-brand-text/5 text-brand-text hover:bg-brand-text/10'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
