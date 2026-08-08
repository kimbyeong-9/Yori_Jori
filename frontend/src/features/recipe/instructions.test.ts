import { describe, expect, it } from 'vitest'
import { splitInstructionSteps } from './instructions'

describe('splitInstructionSteps', () => {
  it('번호가 매겨진 줄을 단계별로 분리한다', () => {
    const instructions = '1. 재료를 썬다.\n2. 볶는다.\n3. 간을 맞춘다.'
    expect(splitInstructionSteps(instructions)).toEqual([
      '재료를 썬다.',
      '볶는다.',
      '간을 맞춘다.',
    ])
  })

  it('번호가 없는 줄은 바로 앞 단계에 이어 붙인다', () => {
    const instructions = '1. 재료를 썬다.\n계속 잘 저어준다.\n2. 볶는다.'
    expect(splitInstructionSteps(instructions)).toEqual([
      '재료를 썬다. 계속 잘 저어준다.',
      '볶는다.',
    ])
  })

  it('번호가 하나도 없으면 전체를 1단계로 취급한다', () => {
    const instructions = '재료를 볶다가 간을 맞추면 완성입니다.'
    expect(splitInstructionSteps(instructions)).toEqual([
      '재료를 볶다가 간을 맞추면 완성입니다.',
    ])
  })

  it('빈 줄은 무시한다', () => {
    const instructions = '1. 재료를 썬다.\n\n2. 볶는다.'
    expect(splitInstructionSteps(instructions)).toEqual(['재료를 썬다.', '볶는다.'])
  })

  it('줄바꿈 없이 한 줄로 이어진 번호 단계도 분리한다 (실제 Gemini 응답 재현)', () => {
    const instructions =
      '1. 돼지고기와 양파를 한 입 크기로 썰어줍니다. 2. 냄비에 돼지고기를 볶습니다. ' +
      '3. 간장과 설탕을 넣고 조립니다. 4. 참기름을 둘러 마무리합니다.'
    expect(splitInstructionSteps(instructions)).toEqual([
      '돼지고기와 양파를 한 입 크기로 썰어줍니다.',
      '냄비에 돼지고기를 볶습니다.',
      '간장과 설탕을 넣고 조립니다.',
      '참기름을 둘러 마무리합니다.',
    ])
  })

  it('소수점 표기(마침표 뒤 공백 없음)는 단계 구분자로 오인하지 않는다', () => {
    const instructions = '1. 물 1.5컵을 넣고 끓인다. 2. 면을 넣는다.'
    expect(splitInstructionSteps(instructions)).toEqual([
      '물 1.5컵을 넣고 끓인다.',
      '면을 넣는다.',
    ])
  })
})
