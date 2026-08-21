/**
 * 비용 관련 유틸리티 함수
 */

import { CourseStop } from '../types';

/** 총 1인당 예상 비용 계산 */
export function calculateTotalCost(stops: CourseStop[]): number {
  return stops.reduce((sum, stop) => sum + stop.estimatedCost, 0);
}

/** 비용을 원 단위로 표시 */
export function formatCost(cost: number): string {
  if (cost === 0) return '무료';
  return `${cost.toLocaleString('ko-KR')}원`;
}

/** 1인당 예산 내에 전체 코스가 들어오는지 확인 */
export function isWithinBudget(
  totalCostPerPerson: number,
  budgetPerPerson: number | null
): boolean {
  if (budgetPerPerson === null) return true; // 상관없음
  return totalCostPerPerson <= budgetPerPerson;
}

/** 남은 예산 계산 */
export function getRemainingBudget(
  currentTotalCost: number,
  budgetPerPerson: number | null
): number | null {
  if (budgetPerPerson === null) return null;
  return Math.max(0, budgetPerPerson - currentTotalCost);
}
