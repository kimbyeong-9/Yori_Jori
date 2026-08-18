import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { label: '레시피 검색', to: '/' },
  { label: '저장된 레시피', to: '/saved' },
]

export function NavBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 z-50 h-[60px] w-full border-b border-brand-text/10 bg-white/90 shadow-sm backdrop-blur-[6px] md:h-[77px]">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex-shrink-0" aria-label="리쿡 홈으로 이동">
          <img src="/images/logo.png" alt="리쿡 로고" className="h-9 w-auto object-contain md:h-12" />
        </Link>

        <div className="hidden items-center gap-8 text-[15px] font-medium text-brand-text md:flex">
          {NAV_ITEMS.map(({ label, to }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className="relative pb-1 font-semibold transition-colors hover:text-brand-primary"
              >
                <span className={isActive ? 'text-brand-primary' : 'text-brand-text-sub'}>
                  {label}
                </span>
                <span
                  className="absolute bottom-0 left-0 right-0 bg-brand-primary transition-opacity"
                  style={{
                    height: '2px',
                    borderRadius: '9999px',
                    opacity: isActive ? 1 : 0,
                    transitionDuration: '0.25s',
                  }}
                />
              </Link>
            )
          })}
        </div>

        <button
          onClick={() => navigate('/fridge')}
          className="hidden items-center gap-2 rounded-full bg-brand-primary px-5 py-2 text-[14px] font-medium text-white shadow-sm transition-colors hover:opacity-90 md:flex"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="4" y1="10" x2="20" y2="10" />
            <line x1="9" y1="6" x2="9" y2="8" />
            <line x1="9" y1="14" x2="9" y2="18" />
          </svg>
          나의 냉장고
        </button>

        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => navigate('/fridge')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-white"
            aria-label="나의 냉장고"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="4" y1="10" x2="20" y2="10" />
              <line x1="9" y1="6" x2="9" y2="8" />
              <line x1="9" y1="14" x2="9" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center"
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="#1C1C15"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="#1C1C15"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="17" y2="6" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-1 border-t border-brand-text/10 bg-white px-4 py-3 shadow-md md:hidden">
          {NAV_ITEMS.map(({ label, to }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive ? 'bg-brand-primary/5 text-brand-primary' : 'text-brand-text-sub'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
