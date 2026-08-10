import { StaticPageLayout } from '../components/StaticPageLayout'

export function TermsPage() {
  return (
    <StaticPageLayout title="이용 약관">
      <p className="mb-4 text-right text-xs text-brand-text-sub">마지막 업데이트: 2026년 3월 25일</p>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">제1조 (목적)</h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          이 약관은 요리조리(이하 "회사")가 제공하는 AI 레시피 추천 서비스(이하 "서비스")를 이용함에 있어
          회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">
          제2조 (레시피 정보 제공 및 책임의 한계)
        </h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          1. 회사는 AI 기술 기반으로 생성형 레시피를 무료로 제공합니다.
          <br />
          2. AI가 생성한 레시피의 계량 수치, 조리 방법, 성분 정보 등은 완벽하게 정확하지 않을 수
          있으며, 이는 전적으로 이용자의 참고 목적으로 제공됩니다.
          <br />
          3. 회사는 제공된 레시피를 이용자가 조리하고 취식하는 과정에서 발생하는 맛, 위생, 건강상의
          문제(알레르기, 식중독 등) 및 물리적 손해(화상, 화재 등)에 대해 일체의 법적 책임을 지지
          않습니다.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">
          제3조 (서비스 이용 및 데이터 활용)
        </h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          1. 회사는 익명화된 세션(Session) 데이터를 기반으로 서비스를 제공합니다. 별도의 회원가입
          절차 없이 브라우저 단위로 저장 내역을 보존합니다.
          <br />
          2. 이용자가 입력한 식재료, 선택한 레시피 등은 서비스 품질 향상(AI 모델 개선, 검색 정확도
          향상 등)을 위한 통계 자료로 활용될 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">제4조 (약관의 변경)</h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          회사는 필요 시 관계 법령을 위배하지 않는 범위 내에서 이 약관을 개정할 수 있습니다. 변경된
          내용은 서비스 내 공지사항을 통해 안내합니다.
        </p>
      </section>
    </StaticPageLayout>
  )
}
