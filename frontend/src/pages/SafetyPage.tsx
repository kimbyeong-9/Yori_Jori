import { StaticPageLayout } from '../components/StaticPageLayout'

export function SafetyPage() {
  return (
    <StaticPageLayout title="안전 안내">
      <div className="mb-2 rounded-xl bg-brand-accent p-4 text-center text-sm font-semibold text-brand-primary">
        리쿡의 AI 레시피를 이용하시기 전, 아래의 안전 수칙을 반드시 확인해 주시기 바랍니다.
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-text">
          <span className="text-2xl" aria-hidden="true">
            ⚠️
          </span>
          알레르기 주의
        </h2>
        <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-brand-text-sub">
          <li>
            제공되는 레시피는 AI에 의해 생성되므로, 사용자의 특정{' '}
            <strong>알레르기 정보(예: 땅콩, 갑각류, 유제품 등)</strong>를 완벽하게 필터링하지 못할 수
            있습니다.
          </li>
          <li>반드시 본인이 섭취 가능한 식재료인지 확인한 후 조리하시기 바랍니다.</li>
          <li>대체 식재료를 사용할 경우에도 성분을 꼼꼼히 확인해 주세요.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-text">
          <span className="text-2xl" aria-hidden="true">
            🗓️
          </span>
          식재료 신선도 및 유통기한
        </h2>
        <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-brand-text-sub">
          <li>
            앱 내에서 관리되는 '신선/소비기한 임박' 상태는 사용자 편의를 위한{' '}
            <strong>참고용 데이터</strong>입니다.
          </li>
          <li>실제 식재료의 부패 여부, 색상, 냄새를 눈으로 직접 확인하시기 바랍니다.</li>
          <li>권장 소비기한이 지나거나, 상한 것으로 의심되는 재료는 절대 섭취하지 마십시오.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-text">
          <span className="text-2xl" aria-hidden="true">
            🔥
          </span>
          조리 시 화기 및 도구 안전
        </h2>
        <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-brand-text-sub">
          <li>칼이나 가위를 다룰 때는 항상 손을 조심하시고, 사용 후에는 안전한 곳에 보관해 주세요.</li>
          <li>
            가스레인지, 인덕션 등 화기 사용 시 자리를 비우지 마시고, 기름 튀김 등에 주의하시기
            바랍니다.
          </li>
          <li>조리 시간은 주방 기기의 출력(W수)에 따라 달라질 수 있으므로, 상태를 수시로 확인하세요.</li>
        </ul>
      </section>
    </StaticPageLayout>
  )
}
