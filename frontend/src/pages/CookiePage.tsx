import { StaticPageLayout } from '../components/StaticPageLayout'

export function CookiePage() {
  return (
    <StaticPageLayout title="쿠키 정책 (Cookie Policy)">
      <p className="mb-4 text-center text-sm leading-relaxed text-brand-text-sub">
        리쿡(ReCook)은 이용자에게 연속적이고 원활한 서비스를 제공하기 위해 <br />
        브라우저의 쿠키(Cookie) 및 로컬 스토리지(Local Storage)를 운용합니다.
      </p>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">1. 쿠키 및 로컬스토리지의 정의</h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          쿠키와 로컬 스토리지는 웹사이트가 이용자의 브라우저 또는 기기에 저장하는 작은 텍스트 데이터
          파일입니다. 리쿡은 회원가입 절차가 없으므로, 이 기술들을 활용하여 이용자를 식별하고
          서비스 이용 기록을 보장합니다.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">2. 저장 및 사용되는 정보</h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          리쿡에서 사용하는 브라우저 저장 정보는 다음과 같습니다.
          <br />
          <br />
          <strong>- Browser UUID (`browser_uuid`):</strong> 기기를 고유하게 식별하기 위한 무작위
          문자열입니다.
          <br />
          <strong>- Session ID (`session_id`):</strong> 레시피 클릭 및 저장, 식재료 추가 이력 등을
          서버에 동기화하기 위한 세션 식별 키입니다.
          <br />
          <strong>- 저장한 레시피:</strong> 하트(♡) 아이콘으로 보관함에 담은 레시피 목록은 세션에
          연동되어 서버에 저장됩니다.
          <br />
          <strong>- 기타 UI 상태:</strong> 페이지네이션 내역, 검색 중이던 식재료 정보 등이 임시
          저장될 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-[15px] font-bold text-brand-text">3. 쿠키 거부 및 삭제 방법</h2>
        <p className="text-sm leading-relaxed text-brand-text-sub">
          이용자는 웹 브라우저의 옵션 설정을 통해 쿠키 및 로컬 스토리지 데이터 저장을 거부하실 수
          있습니다. 다만, 이 기능을 차단하거나 삭제할 경우{' '}
          <strong>저장된 레시피 기록이 초기화되거나 맞춤형 추천 기능이 제한될 수 있습니다.</strong>
          <br />
          <br />
          - 크롬(Chrome): 설정 &gt; 개인정보 및 보안 &gt; 인터넷 사용 기록 삭제 또는 쿠키 및 기타
          사이트 데이터 설정
          <br />- 사파리(Safari): 환경설정 &gt; 개인정보 보호 &gt; 쿠키 및 웹 사이트 데이터 차단/지우기
        </p>
      </section>
    </StaticPageLayout>
  )
}
