// instructions는 "N. ..." 형식으로 번호가 매겨져 저장된다(시드 데이터, Gemini 프롬프트
// 지시사항 모두 동일). 단계 사이가 줄바꿈으로 구분될 때도 있고, Gemini가 줄바꿈 없이 한
// 줄에 공백으로만 이어서 줄 때도 있어(실사용 응답에서 확인됨) 줄 단위로 나누지 않고
// "숫자+마침표+공백" 패턴 자체를 단계 구분자로 찾아 나눈다. 소수점 표기(예: "1.5컵")는
// 마침표 뒤에 공백이 없어 구분자로 잡히지 않는다.
const STEP_MARKER = /\d+\.\s+/g

export function splitInstructionSteps(instructions: string): string[] {
  const normalized = instructions.trim()
  if (!normalized) return []

  const markers = [...normalized.matchAll(STEP_MARKER)]
  if (markers.length === 0) {
    return [normalized.replace(/\s+/g, ' ')]
  }

  const steps: string[] = []
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index! + markers[i][0].length
    const end = i + 1 < markers.length ? markers[i + 1].index! : normalized.length
    const text = normalized.slice(start, end).replace(/\s+/g, ' ').trim()
    if (text) steps.push(text)
  }

  return steps.length > 0 ? steps : [normalized]
}
