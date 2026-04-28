import type { AlertType } from '../shared/types'

export function checkCondition(
  type: AlertType,
  value: number,
  price: number,
  changePercent: number
): boolean {
  switch (type) {
    case 'floor':
      return price <= value
    case 'ceiling':
      return price >= value
    case 'percent':
      return Math.abs(changePercent) >= value
  }
}
