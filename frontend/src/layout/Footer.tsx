import { useState } from 'react'
import { Link } from 'react-router-dom'

export function Footer() {
  const [copyDone, setCopyDone] = useState(false)

  const handleShare = async () => {
    if (copyDone) return
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    } catch {
      alert('링크 복사에 실패했습니다. 주소창에서 직접 복사해 주세요.')
    }
  }

  return (
    <footer className="border-t border-brand-text/10 bg-white px-5 pt-10 pb-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-8 md:flex-row md:gap-10">
          <div className="max-w-xs flex-shrink-0">
            <div className="mb-2">
              <img
                src="/images/yorijori.png"
                alt="요리조리 로고"
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="mb-2 text-sm font-semibold text-brand-text">
              Better cooking, simplified
            </p>
            <p className="break-keep text-xs leading-relaxed text-brand-text-sub">
              냉장고 속 재료로 오늘 뭐 먹을지 고민될 때, 요리조리가 딱 맞는 레시피를 찾아드립니다.
            </p>
            <button
              onClick={handleShare}
              className="mt-4 transition-colors"
              aria-label="현재 페이지 링크 복사"
              title={copyDone ? '링크가 복사되었습니다!' : '링크 복사'}
            >
              {copyDone ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-brand-text-sub hover:text-brand-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex gap-8 md:ml-auto md:gap-16">
            <div>
              <p className="mb-3 text-sm font-semibold text-brand-text">탐색</p>
              <ul className="space-y-2 text-sm text-brand-text-sub">
                <li>
                  <Link to="/recipes" className="transition-colors hover:text-brand-primary">
                    레시피
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-brand-text">고객지원</p>
              <ul className="space-y-2 text-sm text-brand-text-sub">
                <li>
                  <Link
                    to="/support/help"
                    className="transition-colors hover:text-brand-primary"
                  >
                    도움말
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support/safety"
                    className="transition-colors hover:text-brand-primary"
                  >
                    안전 안내
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support/contact"
                    className="transition-colors hover:text-brand-primary"
                  >
                    문의하기
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-brand-text">약관</p>
              <ul className="space-y-2 text-sm text-brand-text-sub">
                <li>
                  <Link to="/legal/terms" className="transition-colors hover:text-brand-primary">
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link
                    to="/legal/privacy"
                    className="whitespace-nowrap transition-colors hover:text-brand-primary"
                  >
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link to="/legal/cookie" className="transition-colors hover:text-brand-primary">
                    쿠키 정책
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-text/10 pt-4">
          <p className="break-keep text-xs text-brand-text-sub">
            © 2026 Yorijori Culinary Curator. All rights reserved. v0.1.0
          </p>
        </div>
      </div>
    </footer>
  )
}
