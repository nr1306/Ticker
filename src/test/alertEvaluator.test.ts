import { describe, it, expect } from 'vitest'
import { checkCondition } from '../main/alertEvaluator'

describe('checkCondition', () => {
  describe('floor', () => {
    it('triggers when price equals floor', () => {
      expect(checkCondition('floor', 180, 180, 0)).toBe(true)
    })
    it('triggers when price is below floor', () => {
      expect(checkCondition('floor', 180, 179.99, 0)).toBe(true)
    })
    it('does not trigger when price is above floor', () => {
      expect(checkCondition('floor', 180, 180.01, 0)).toBe(false)
    })
  })

  describe('ceiling', () => {
    it('triggers when price equals ceiling', () => {
      expect(checkCondition('ceiling', 200, 200, 0)).toBe(true)
    })
    it('triggers when price exceeds ceiling', () => {
      expect(checkCondition('ceiling', 200, 200.01, 0)).toBe(true)
    })
    it('does not trigger when price is below ceiling', () => {
      expect(checkCondition('ceiling', 200, 199.99, 0)).toBe(false)
    })
  })

  describe('percent', () => {
    it('triggers when daily change equals threshold (positive)', () => {
      expect(checkCondition('percent', 3, 0, 3)).toBe(true)
    })
    it('triggers when daily change exceeds threshold (positive)', () => {
      expect(checkCondition('percent', 3, 0, 4.5)).toBe(true)
    })
    it('triggers when daily change exceeds threshold (negative)', () => {
      expect(checkCondition('percent', 3, 0, -3.2)).toBe(true)
    })
    it('does not trigger when positive change is below threshold', () => {
      expect(checkCondition('percent', 3, 0, 2.9)).toBe(false)
    })
    it('does not trigger when negative change is below threshold', () => {
      expect(checkCondition('percent', 3, 0, -2.9)).toBe(false)
    })
  })
})
