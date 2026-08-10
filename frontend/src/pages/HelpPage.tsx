import { StaticPageLayout } from '../components/StaticPageLayout'

export function HelpPage() {
  return (
    <StaticPageLayout title="도움말 (FAQ)">
      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-primary">
          1. 요리조리(YoriJori)는 어떤 서비스인가요?
        </h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          요리조리는 냉장고에 남은 식재료를 기반으로 최적의 레시피를 AI가 추천해주는 큐레이션
          서비스입니다. 사용자가 식재료를 입력하면, AI가 조합 가능한 요리를 분석하고 레시피를
          생성하여 제안합니다.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-primary">2. 식재료는 어떻게 등록하나요?</h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          상단 메뉴의 <strong>나의 냉장고</strong> 탭으로 이동하시거나, 메인 화면의 입력란을 통해
          재료를 텍스트로 등록할 수 있습니다. 등록된 재료의 신선도(소비기한) 역시 손쉽게 관리할 수
          있습니다.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-primary">
          3. 추천된 레시피를 나중에 다시 볼 수 있나요?
        </h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          네, 가능합니다. 레시피 상세 페이지 우측 상단의 <strong>♡ (하트)</strong> 아이콘을
          누르시면, 저장된 레시피 목록에 추가됩니다. 저장된 레시피는 세션과 연동되어 언제든지
          꺼내보실 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-brand-primary">
          4. AI 레시피의 분량은 몇 인분 기준인가요?
        </h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          기본적으로 <strong>1~2인분</strong>을 기준으로 계량이 안내됩니다. 요리의 특성에 따라
          계량의 차이가 있을 수 있으니, 조리 시간을 보며 기호에 맞게 조절하시는 것을 권장합니다.
        </p>
      </section>
    </StaticPageLayout>
  )
}
