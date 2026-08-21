/**
 * 거리 및 이동시간 계산 유틸리티
 */

import { TransportType } from '../types';

/** 두 좌표 사이의 직선 거리 (미터, Haversine 공식) */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 이동수단별 예상 이동시간 (분) */
export function estimateTravelTime(distanceMeters: number, transport: TransportType): number {
  // 직선 거리에 도로 보정계수 적용 (약 1.4배)
  const roadDistance = distanceMeters * 1.4;

  switch (transport) {
    case 'walk':
      // 도보: 약 5km/h = 83m/min
      return Math.ceil(roadDistance / 83);
    case 'public':
      // 대중교통: 약 15km/h = 250m/min (대기시간 포함)
      return Math.ceil(roadDistance / 250) + 5; // 대기시간 5분 추가
    case 'car':
      // 자동차: 약 30km/h = 500m/min (도심 기준)
      return Math.ceil(roadDistance / 500) + 3; // 주차 시간 3분 추가
    case 'any':
      // 혼합: 대중교통 기준 적용
      return Math.ceil(roadDistance / 250) + 3;
    default:
      return Math.ceil(roadDistance / 250);
  }
}

/** 거리를 사람이 읽기 좋은 형태로 변환 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/** 이동시간을 사람이 읽기 좋은 형태로 변환 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `약 ${minutes}분`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `약 ${h}시간 ${m}분` : `약 ${h}시간`;
}
