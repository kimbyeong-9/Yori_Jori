import { StaticPageLayout } from '../components/StaticPageLayout'

export function PrivacyPage() {
  return (
    <StaticPageLayout title="개인정보처리방침">
      <p className="mb-4 text-right text-xs text-brand-text-sub">시행일자: 2026년 3월 25일</p>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">1. 개인정보의 수집 항목 및 방법</h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          리쿡은 회원가입 절차가 없는 익명 기반 서비스입니다. 따라서 이용자의 성명, 연락처,
          이메일 등의 <strong>식별이 가능한 민감 개인정보를 일체 수집하거나 보관하지 않습니다.</strong>
          <br />
          <br />
          다만, 서비스 이용(레시피 추천, 저장 등)의 품질 향상 및 세션 유지를 위해 다음과 같은 데이터가
          수집될 수 있습니다.
          <br />
          - 기기(브라우저) 고유 식별자 (UUID 방식의 익명 세션 ID)
          <br />
          - 입력한 식재료, 선택 및 클릭한 레시피, 선호(저장) 레시피 목록
          <br />- 서비스 이용 기록 및 접속 로그 (IP 주소, 브라우저 환경)
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">2. 수집된 정보의 이용 목적</h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          리쿡은 위 수집된 비식별 활동 로그를 다음의 목적을 위해서만 이용합니다.
          <br />
          - 서비스 경험 고도화: 맞춤형 레시피 추천 AI 프롬프트 개선
          <br />
          - 서비스 이용 내역 연동: 사용자의 '저장된 레시피' 연속성 제공 및 동기화
          <br />- 서비스 버그 수정, 로그 기반 신규 기능 기획 및 사용자 환경 최적화
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">3. 데이터의 보관 및 파기</h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          회사는 이용자의 비식별 세션 데이터 및 접근 로그를 최장 1년간 보관하며, 보관 기간이
          경과하거나 이용 목적이 달성된 경우 해당 데이터를 지체 없이 파기합니다.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">4. 개인정보 보호 담당자 안내</h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          본 서비스는 무기명 기반이므로 개인정보 열람 및 정정 절차는 제공되지 않습니다. 그러나 서비스
          이용과 관련하여 개인정보 처리에 관한 문의가 있으실 경우, 고객센터(support@recook.co.kr)로
          연락 주시면 신속하게 답변해 드리겠습니다.
        </p>
      </section>
    </StaticPageLayout>
  )
}
