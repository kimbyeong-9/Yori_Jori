import { StaticPageLayout } from '../components/StaticPageLayout'

export function ContactPage() {
  return (
    <StaticPageLayout title="문의하기">
      <p className="mb-2 text-center text-sm leading-relaxed text-brand-text-sub">
        리쿡 서비스 이용에 불편함이 있으시거나, 제휴 및 기타 문의가 있으신 경우
        <br />
        언제든지 고객센터로 연락 주시기 바랍니다.
      </p>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center rounded-xl border border-brand-text/10 bg-brand-background p-6">
          <LinkedEmailIcon />
          <h3 className="mb-1 text-lg font-bold text-brand-text">이메일 문의</h3>
          <p className="text-sm text-brand-text-sub">support@recook.co.kr</p>
          <p className="mt-2 text-xs text-brand-text-sub">평일 10:00 - 18:00 (주말 및 공휴일 휴무)</p>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-brand-text/10 bg-brand-background p-6">
          <PhoneIcon />
          <h3 className="mb-1 text-lg font-bold text-brand-text">고객센터</h3>
          <p className="text-sm font-bold text-brand-primary">1588-0000</p>
          <p className="mt-2 text-xs text-brand-text-sub">유선 연결이 어려울 경우 이메일을 이용해주세요.</p>
        </div>
      </div>
    </StaticPageLayout>
  )
}

function LinkedEmailIcon() {
  return (
    <svg
      className="mb-3 h-8 w-8 text-brand-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg
      className="mb-3 h-8 w-8 text-brand-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  )
}
