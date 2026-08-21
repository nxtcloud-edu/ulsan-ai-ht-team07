import { KakaoPlaceInfo } from '../types';

/**
 * 카카오 로컬 API 서비스
 *
 * 카카오 개발자센터(https://developers.kakao.com)에서
 * 애플리케이션 등록 후 REST API 키 발급 필요
 *
 * API 문서: https://developers.kakao.com/docs/latest/ko/local/dev-guide
 *
 * [제한사항]
 * - 일 50만 건 호출 가능 (무료)
 * - REST API 키는 백엔드(ildan-nawa-backend)에서만 관리하며, 프론트는
 *   `/api/kakao/local/keyword`를 통해 백엔드 프록시를 호출합니다.
 * - 검색 결과에 후기 텍스트는 미포함, placeUrl로 카카오맵 상세 페이지(후기 포함) 접근 가능
 */

interface KakaoLocalApiResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
    same_name?: {
      region: string[];
      keyword: string;
      selected_region: string;
    };
  };
  documents: KakaoLocalDocument[];
}

interface KakaoLocalDocument {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // 경도 (longitude)
  y: string; // 위도 (latitude)
  place_url: string;
  distance?: string;
}

/**
 * 카카오 로컬 API로 장소를 키워드 검색합니다.
 *
 * @param keyword - 검색 키워드 (장소명 또는 "장소명 지역명")
 * @param options - 검색 옵션 (좌표 기반 정렬, 반경 제한 등)
 */
export async function searchKakaoPlace(
  keyword: string,
  options?: {
    latitude?: number;
    longitude?: number;
    radius?: number; // 미터 단위, 최대 20000
    page?: number;
    size?: number;
  }
): Promise<KakaoPlaceInfo[]> {
  try {
    const params = new URLSearchParams({
      query: keyword,
      page: String(options?.page || 1),
      size: String(options?.size || 5),
    });

    // 좌표 기반 정렬 (가까운 순)
    if (options?.latitude && options?.longitude) {
      params.set('y', String(options.latitude));
      params.set('x', String(options.longitude));
      params.set('sort', 'distance');

      if (options.radius) {
        params.set('radius', String(options.radius));
      }
    }

    // 백엔드 프록시를 통해 호출 (API 키는 백엔드에서 부착)
    const response = await fetch(`/api/kakao/local/keyword?${params.toString()}`);

    if (!response.ok) {
      console.error('[KakaoLocal] API 응답 오류:', response.status);
      return [];
    }

    const data: KakaoLocalApiResponse = await response.json();

    return data.documents.map((doc) => ({
      kakaoId: doc.id,
      placeName: doc.place_name,
      phone: doc.phone || undefined,
      addressName: doc.address_name,
      roadAddressName: doc.road_address_name || undefined,
      categoryName: doc.category_name,
      placeUrl: doc.place_url,
      latitude: parseFloat(doc.y),
      longitude: parseFloat(doc.x),
    }));
  } catch (error) {
    console.error('[KakaoLocal] 검색 실패:', error);
    return [];
  }
}

/**
 * 장소명과 지역으로 가장 일치하는 카카오맵 장소를 찾습니다.
 *
 * @param placeName - 장소명
 * @param region - 지역명 (예: "울산 남구")
 * @param coords - 기준 좌표 (있으면 가까운 순 정렬)
 */
export async function findKakaoPlace(
  placeName: string,
  region: string,
  coords?: { latitude: number; longitude: number }
): Promise<KakaoPlaceInfo | null> {
  const keyword = `${placeName} ${region}`;
  const results = await searchKakaoPlace(keyword, {
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    size: 3,
  });

  if (results.length === 0) return null;

  // 이름이 가장 유사한 결과를 반환
  const bestMatch = results.find((r) =>
    r.placeName.includes(placeName) || placeName.includes(r.placeName)
  );

  return bestMatch || results[0];
}

/**
 * 카카오맵 장소 상세 페이지 URL을 생성합니다.
 * 이 페이지에서 후기, 사진, 별점 등을 볼 수 있습니다.
 */
export function getKakaoMapReviewUrl(kakaoId: string): string {
  return `https://place.map.kakao.com/${kakaoId}#comment`;
}

/**
 * 카카오맵 검색 URL을 생성합니다 (API 키 없이 사용 가능).
 */
export function getKakaoMapSearchUrl(placeName: string, region: string): string {
  const query = encodeURIComponent(`${placeName} ${region}`);
  return `https://map.kakao.com/?q=${query}`;
}

/**
 * 카카오 API 사용 가능 여부.
 * 키는 백엔드에서 관리하므로 프론트에서는 항상 시도하고,
 * 백엔드가 꺼져 있거나 키가 없으면 각 호출이 빈 배열로 자연히 폴백합니다.
 */
export function isKakaoApiConfigured(): boolean {
  return true;
}
