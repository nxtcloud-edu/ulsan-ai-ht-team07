/**
 * 카카오 로컬 API 서비스 (백엔드)
 *
 * API 키를 서버에서 관리하여 클라이언트에 노출되지 않도록 합니다.
 */

const KAKAO_API_BASE = 'https://dapi.kakao.com';

export interface KakaoDocument {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // 경도
  y: string; // 위도
  place_url: string;
  distance?: string;
}

interface KakaoSearchResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoDocument[];
}

/**
 * 카카오 키워드 검색
 */
export async function searchByKeyword(params: {
  query: string;
  x?: string;
  y?: string;
  radius?: number;
  page?: number;
  size?: number;
  sort?: 'accuracy' | 'distance';
}): Promise<KakaoSearchResponse> {
  const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || '';
  if (!KAKAO_REST_API_KEY) {
    throw new Error('KAKAO_REST_API_KEY가 설정되지 않았습니다.');
  }

  const searchParams = new URLSearchParams({
    query: params.query,
    page: String(params.page || 1),
    size: String(params.size || 5),
    sort: params.sort || 'accuracy',
  });

  if (params.x) searchParams.set('x', params.x);
  if (params.y) searchParams.set('y', params.y);
  if (params.radius) searchParams.set('radius', String(params.radius));

  const response = await fetch(
    `${KAKAO_API_BASE}/v2/local/search/keyword.json?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`카카오 API 오류 (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<KakaoSearchResponse>;
}

/**
 * 카테고리별 장소 검색
 */
export async function searchPlacesByCategory(
  keyword: string,
  lat: number,
  lng: number,
  radius: number = 5000,
  size: number = 5
): Promise<KakaoDocument[]> {
  const result = await searchByKeyword({
    query: keyword,
    y: String(lat),
    x: String(lng),
    radius,
    size,
    sort: 'accuracy',
  });

  return result.documents;
}
