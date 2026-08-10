import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ContactPage } from './ContactPage'
import { CookiePage } from './CookiePage'
import { HelpPage } from './HelpPage'
import { PrivacyPage } from './PrivacyPage'
import { SafetyPage } from './SafetyPage'
import { TermsPage } from './TermsPage'

describe('약관/고객지원 정적 페이지', () => {
  it.each([
    [TermsPage, '이용 약관'],
    [PrivacyPage, '개인정보처리방침'],
    [CookiePage, '쿠키 정책 (Cookie Policy)'],
    [HelpPage, '도움말 (FAQ)'],
    [SafetyPage, '안전 안내'],
    [ContactPage, '문의하기'],
  ])('%s가 제목을 렌더링한다', async (Page, title) => {
    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
  })
})
