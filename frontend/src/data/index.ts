import { Place } from '../types';
import { ulsanPlaces } from './places-ulsan';

/**
 * 도시별 장소 데이터 레지스트리
 * 
 * 새로운 도시 추가 시:
 * 1. places-[city].ts 파일 생성
 * 2. 여기에 import 및 등록
 * 
 * 예: 부산 추가 시
 * import { busanPlaces } from './places-busan';
 * cityPlaces['busan'] = busanPlaces;
 */

const cityPlaces: Record<string, Place[]> = {
  ulsan: ulsanPlaces,
  // busan: busanPlaces,
  // seoul: seoulPlaces,
  // daegu: daeguPlaces,
};

/** 특정 도시의 장소 데이터 조회 */
export function getPlacesByCity(city: string): Place[] {
  return cityPlaces[city] || [];
}

/** 특정 지역(동네)의 장소 데이터 조회 */
export function getPlacesByNeighborhood(city: string, neighborhood: string): Place[] {
  return getPlacesByCity(city).filter((p) => p.neighborhood === neighborhood);
}

/** 모든 장소 데이터 */
export function getAllPlaces(): Place[] {
  return Object.values(cityPlaces).flat();
}

/** 지원되는 도시 목록 */
export function getSupportedCities(): string[] {
  return Object.keys(cityPlaces);
}

/** 지역 프리셋에서 동네 목록으로 매핑 */
export const locationPresetMap: Record<string, { neighborhoods: string[]; city: string }> = {
  ulsan_univ: { neighborhoods: ['무거동'], city: 'ulsan' },
  samsan: { neighborhoods: ['삼산동'], city: 'ulsan' },
  seongnam: { neighborhoods: ['성남동'], city: 'ulsan' },
  ilsan_daewangam: { neighborhoods: ['일산동', '대왕암'], city: 'ulsan' },
  ulju: { neighborhoods: ['울주군'], city: 'ulsan' },
};

export { ulsanPlaces };
