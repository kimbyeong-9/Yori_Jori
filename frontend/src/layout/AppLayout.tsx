import { NavLink, Outlet } from 'react-router-dom'
import { ErrorState } from '../components/ErrorState'
import { useSession } from '../context/SessionContext'

const NAV_ITEMS = [
  { to: '/', label: '홈' },
  { to: '/fridge', label: '냉장고' },
  { to: '/ingredients/new', label: '재료 추가' },
  { to: '/saved', label: '저장한 레시피' },
]

export function AppLayout() {
  const { sessionId, error } = useSession()

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
      <header className="sticky top-0 z-10 border-b border-brand-text/10 bg-brand-background/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="shrink-0 whitespace-nowrap text-lg font-semibold text-brand-primary">
            요리조리
          </NavLink>
          <nav className="flex min-w-0 gap-1 overflow-x-auto text-sm sm:gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 font-medium ${
                    isActive
                      ? 'bg-brand-primary text-white'
                      : 'text-brand-text hover:bg-brand-text/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6">
        {!sessionId && error ? <ErrorState message={error} /> : <Outlet />}
      </main>
    </div>
  )
}
