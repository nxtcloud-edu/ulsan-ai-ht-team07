/**
 * 빠른 추천 프리셋
 * "생각하기도 귀찮아요" 영역의 버튼별 기본 설정
 */

import { UserPreferences, QuickPreset } from '../types';
import { getCurrentTime, getTodayDate } from '../utils/time';

/** 빠른 추천 프리셋 정보 */
export interface QuickPresetInfo {
  id: QuickPreset;
  label: string;
  emoji: string;
  description: string;
}

export const quickPresets: QuickPresetInfo[] = [
  { id: 'friend_now', label: '지금 친구랑', emoji: '👫', description: '친구와 즉흥 놀기' },
  { id: 'date_today', label: '오늘 데이트', emoji: '💑', description: '연인과 데이트 코스' },
  { id: 'parent_outing', label: '부모님과 나들이', emoji: '👨‍👩‍👧', description: '부모님 모시고 나들이' },
  { id: 'after_work', label: '회식 후 2차', emoji: '🍻', description: '동료와 2차 코스' },
  { id: 'solo_time', label: '혼자 시간 보내기', emoji: '🎧', description: '나만의 시간' },
  { id: 'rainy_day', label: '비 오는 날', emoji: '🌧️', description: '실내 위주 코스' },
  { id: 'budget', label: '돈 적게 쓰기', emoji: '💰', description: '가성비 코스' },
  { id: 'random', label: '완전 랜덤', emoji: '🎲', description: '아무거나 짜줘' },
];

/** 프리셋에서 기본 설정 생성 */
export function getPresetPreferences(preset: QuickPreset): UserPreferences {
  const now = getCurrentTime();
  const base: UserPreferences = {
    companion: 'friend',
    location: '울산 남구 무거동',
    locationCoords: { latitude: 35.5425, longitude: 129.2564 },
    groupSize: 2,
    date: getTodayDate(),
    startTime: now,
    endTime: undefined,
    budgetPerPerson: 30000,
    transport: 'any',
    desiredActivities: ['랜덤'],
    avoidConditions: [],
    foodPreference: null,
  };

  switch (preset) {
    case 'friend_now':
      return {
        ...base,
        companion: 'friend',
        groupSize: 3,
        desiredActivities: ['먹기', '활동적인 체험', '카페'],
      };

    case 'date_today':
      return {
        ...base,
        companion: 'couple',
        groupSize: 2,
        desiredActivities: ['먹기', '카페', '사진'],
        budgetPerPerson: 40000,
      };

    case 'parent_outing':
      return {
        ...base,
        companion: 'parent',
        groupSize: 3,
        transport: 'car',
        desiredActivities: ['먹기', '산책', '카페'],
        avoidConditions: ['많이 걷기', '시끄러운 장소'],
        budgetPerPerson: 50000,
      };

    case 'after_work':
      return {
        ...base,
        companion: 'coworker',
        groupSize: 5,
        startTime: '19:00',
        desiredActivities: ['먹기', '활동적인 체험'],
        budgetPerPerson: 30000,
      };

    case 'solo_time':
      return {
        ...base,
        companion: 'solo',
        groupSize: 1,
        desiredActivities: ['카페', '산책', '문화생활'],
        budgetPerPerson: 20000,
      };

    case 'rainy_day':
      return {
        ...base,
        desiredActivities: ['먹기', '활동적인 체험', '카페'],
        avoidConditions: ['야외'],
      };

    case 'budget':
      return {
        ...base,
        budgetPerPerson: 15000,
        desiredActivities: ['먹기', '카페'],
      };

    case 'random':
      return {
        ...base,
        desiredActivities: ['랜덤'],
      };

    default:
      return base;
  }
}
