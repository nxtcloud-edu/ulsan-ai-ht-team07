/**
 * 지도 서비스 모듈
 * 
 * 지도 API 키가 설정된 경우 장소 검색과 지도 표시 기능을 제공합니다.
 * API 키가 없는 경우 카카오맵 외부 링크를 사용합니다.
 */

import { Place } from '../types';

// ===== 지도 서비스 인터페이스 =====

export interface MapService {
  /** 지도 사용 가능 여부 */
  isAvailable(): boolean;

  /** 장소를 지도에서 열기 */
  openInMap(place: Place): void;

  /** 길찾기 링크 생성 */
  getDirectionsUrl(from: Place | null, to: Place): string;

  /** 장소 검색 (API 연결 시) */
  searchPlaces?(query: string, lat: number, lng: number): Promise<Place[]>;
}

// ===== 카카오맵 외부 링크 서비스 (기본) =====

class KakaoMapExternalService implements MapService {
  isAvailable(): boolean {
    return true; // 외부 링크는 항상 사용 가능
  }

  openInMap(place: Place): void {
    const url = this.getPlaceUrl(place);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  getDirectionsUrl(from: Place | null, to: Place): string {
    if (from) {
      return `https://map.kakao.com/link/to/${encodeURIComponent(to.name)},${to.latitude},${to.longitude}`;
    }
    return `https://map.kakao.com/link/map/${encodeURIComponent(to.name)},${to.latitude},${to.longitude}`;
  }

  private getPlaceUrl(place: Place): string {
    return `https://map.kakao.com/link/map/${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`;
  }
}

// ===== 카카오맵 API 서비스 (확장용) =====

class KakaoMapAPIService implements MapService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  openInMap(place: Place): void {
    const url = `https://map.kakao.com/link/map/${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  getDirectionsUrl(from: Place | null, to: Place): string {
    if (from) {
      return `https://map.kakao.com/link/to/${encodeURIComponent(to.name)},${to.latitude},${to.longitude}`;
    }
    return `https://map.kakao.com/link/map/${encodeURIComponent(to.name)},${to.latitude},${to.longitude}`;
  }

  async searchPlaces(_query: string, _lat: number, _lng: number): Promise<Place[]> {
    // 실제 카카오 로컬 API 호출 구현 위치
    // MVP에서는 빈 배열 반환
    return [];
  }
}

// ===== 서비스 인스턴스 생성 =====

let mapServiceInstance: MapService | null = null;

export function getMapService(): MapService {
  if (mapServiceInstance) return mapServiceInstance;

  const apiKey = import.meta.env.VITE_MAP_API_KEY;

  if (apiKey) {
    mapServiceInstance = new KakaoMapAPIService(apiKey);
  } else {
    mapServiceInstance = new KakaoMapExternalService();
  }

  return mapServiceInstance;
}
