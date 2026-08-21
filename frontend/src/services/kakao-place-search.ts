import { Place, PlaceCategory, KakaoPlaceInfo } from '../types';

/**
 * 카카오 로컬 API를 이용해 실제 장소를 검색하고
 * 앱 내부 Place 객체로 변환하는 서비스
 *
 * REST API 키는 백엔드(ildan-nawa-backend)에서만 관리하며,
 * 프론트는 `/api/kakao/local/keyword` 백엔드 프록시를 호출합니다.
 */

/** 카카오 API 응답 타입 */
interface KakaoKeywordResponse {
  meta: { total_count: number; pageable_count: number; is_end: boolean };
  documents: KakaoDocument[];
}

interface KakaoDocument {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance?: string;
}

/** 앱 카테고리 → 카카오 검색 키워드 매핑 */
const CATEGORY_SEARCH_KEYWORDS: Record<PlaceCategory, string[]> = {
  restaurant: ['맛집', '음식점', '식당'],
  cafe: ['카페', '디저트카페', '커피'],
  bowling: ['볼링장'],
  escape_room: ['방탈출'],
  board_game: ['보드게임카페'],
  accessories_shop: ['소품샵', '악세사리샵'],
  keyring_shop: ['키링샵', '키링만들기'],
  craft_workshop: ['공방', '원데이클래스'],
  exhibition: ['전시회', '갤러리', '미술관'],
  walk: ['산책로', '둘레길'],
  karaoke: ['노래방', '코인노래방'],
  photo_studio: ['셀프사진관', '인생네컷', '포토부스'],
  bar: ['술집', '바', '이자카야'],
  park: ['공원'],
  shopping: ['쇼핑몰', '백화점'],
};

/** 앱 카테고리별 기본 체류 시간 (분) */
const CATEGORY_DURATION: Record<PlaceCategory, number> = {
  restaurant: 60,
  cafe: 50,
  bowling: 60,
  escape_room: 70,
  board_game: 60,
  accessories_shop: 30,
  keyring_shop: 30,
  craft_workshop: 90,
  exhibition: 60,
  walk: 40,
  karaoke: 60,
  photo_studio: 30,
  bar: 60,
  park: 40,
  shopping: 60,
};

/** 앱 카테고리별 평균 비용 (원) */
const CATEGORY_COST: Record<PlaceCategory, number> = {
  restaurant: 12000,
  cafe: 6000,
  bowling: 15000,
  escape_room: 20000,
  board_game: 10000,
  accessories_shop: 15000,
  keyring_shop: 15000,
  craft_workshop: 25000,
  exhibition: 10000,
  walk: 0,
  karaoke: 8000,
  photo_studio: 5000,
  bar: 15000,
  park: 0,
  shopping: 20000,
};

/** 지역 프리셋별 검색 기준 좌표 */
export const REGION_COORDS: Record<string, { lat: number; lng: number; regionName: string }> = {
  ulsan_univ: { lat: 35.5425, lng: 129.2564, regionName: '울산 남구 무거동' },
  samsan: { lat: 35.5387, lng: 129.3365, regionName: '울산 남구 삼산동' },
  seongnam: { lat: 35.5544, lng: 129.3156, regionName: '울산 중구 성남동' },
  ilsan_daewangam: { lat: 35.5836, lng: 129.4355, regionName: '울산 동구 일산동' },
  ulju: { lat: 35.5209, lng: 129.1830, regionName: '울산 울주군' },
  custom: { lat: 35.5384, lng: 129.3114, regionName: '울산' },
};

/**
 * 카카오 키워드 검색 (직접 호출)
 */
async function searchKeyword(
  keyword: string,
  lat: number,
  lng: number,
  radius: number = 3000,
  size: number = 5,
  page: number = 1,
): Promise<KakaoDocument[]> {
  const params = new URLSearchParams({
    query: keyword,
    y: String(lat),
    x: String(lng),
    radius: String(radius),
    size: String(size),
    page: String(page),
    sort: 'accuracy',
  });

  try {
    // 백엔드 프록시를 통해 호출 (API 키는 백엔드에서 부착)
    const response = await fetch(`/api/kakao/local/keyword?${params.toString()}`);

    if (!response.ok) return [];

    const data: KakaoKeywordResponse = await response.json();
    return data.documents;
  } catch {
    return [];
  }
}

/**
 * 카카오 검색 결과를 앱 Place 객체로 변환
 */
function kakaoDocToPlace(doc: KakaoDocument, category: PlaceCategory, regionName: string): Place {
  // 카카오 카테고리에서 서브카테고리 추출
  const categoryParts = doc.category_name.split(' > ');
  const subCategory = categoryParts.length > 2 ? categoryParts.slice(2).join(' ') : undefined;

  // 주소에서 동네 추출
  const addressParts = doc.address_name.split(' ');
  const neighborhood = addressParts.length >= 4 ? addressParts[3] : addressParts[2] || '';
  const district = addressParts.length >= 3 ? addressParts[2] : '';

  const kakaoPlaceInfo: KakaoPlaceInfo = {
    kakaoId: doc.id,
    placeName: doc.place_name,
    phone: doc.phone || undefined,
    addressName: doc.address_name,
    roadAddressName: doc.road_address_name || undefined,
    categoryName: doc.category_name,
    placeUrl: doc.place_url,
    latitude: parseFloat(doc.y),
    longitude: parseFloat(doc.x),
  };

  return {
    id: `kakao-${doc.id}`,
    name: doc.place_name,
    city: 'ulsan',
    district,
    neighborhood,
    address: doc.road_address_name || doc.address_name,
    latitude: parseFloat(doc.y),
    longitude: parseFloat(doc.x),
    category,
    subCategory,
    description: `${doc.place_name} - ${subCategory || doc.category_group_name || ''}`,
    suitableFor: ['friend', 'couple', 'solo', 'parent', 'coworker'],
    moodTags: [],
    activityTags: [],
    indoor: category !== 'walk' && category !== 'park',
    parking: false, // 카카오 API에서는 주차 정보 미제공
    groupSizeMin: 1,
    groupSizeMax: 10,
    averageCost: CATEGORY_COST[category],
    averageDuration: CATEGORY_DURATION[category],
    openingHours: {
      mon: { open: '10:00', close: '22:00' },
      tue: { open: '10:00', close: '22:00' },
      wed: { open: '10:00', close: '22:00' },
      thu: { open: '10:00', close: '22:00' },
      fri: { open: '10:00', close: '23:00' },
      sat: { open: '10:00', close: '23:00' },
      sun: { open: '10:00', close: '21:00' },
    },
    closedDays: [],
    reservationRequired: false,
    mapUrl: doc.place_url,
    featured: false,
    verified: true, // 카카오에서 가져온 실제 장소
    lastUpdated: new Date().toISOString().split('T')[0],
    isSample: false,
    externalData: {
      kakaoPlace: kakaoPlaceInfo,
      fetchedAt: new Date().toISOString(),
    },
  };
}

/**
 * 특정 카테고리의 실제 장소를 카카오 API로 검색합니다.
 *
 * @param category - 장소 카테고리
 * @param locationPreset - 지역 프리셋 키
 * @param count - 가져올 장소 수
 */
export async function searchRealPlaces(
  category: PlaceCategory,
  locationPreset: string,
  count: number = 5,
): Promise<Place[]> {
  const region = REGION_COORDS[locationPreset] || REGION_COORDS['custom'];
  const keywords = CATEGORY_SEARCH_KEYWORDS[category];

  if (!keywords || keywords.length === 0) return [];

  // 첫 번째 키워드 + 지역명으로 검색
  const keyword = `${region.regionName} ${keywords[0]}`;
  const docs = await searchKeyword(keyword, region.lat, region.lng, 5000, count);

  if (docs.length > 0) {
    return docs.map((doc) => kakaoDocToPlace(doc, category, region.regionName));
  }

  // 첫 키워드로 못 찾으면 두 번째 키워드로 시도
  if (keywords.length > 1) {
    const keyword2 = `${region.regionName} ${keywords[1]}`;
    const docs2 = await searchKeyword(keyword2, region.lat, region.lng, 5000, count);
    return docs2.map((doc) => kakaoDocToPlace(doc, category, region.regionName));
  }

  return [];
}

/**
 * 여러 카테고리의 실제 장소를 한번에 검색합니다.
 *
 * @param categories - 검색할 카테고리 목록
 * @param locationPreset - 지역 프리셋 키
 * @param countPerCategory - 카테고리당 가져올 장소 수
 */
export async function searchRealPlacesByCategories(
  categories: PlaceCategory[],
  locationPreset: string,
  countPerCategory: number = 5,
): Promise<Map<PlaceCategory, Place[]>> {
  const results = new Map<PlaceCategory, Place[]>();

  // 병렬로 모든 카테고리 검색
  const promises = categories.map(async (category) => {
    const places = await searchRealPlaces(category, locationPreset, countPerCategory);
    return { category, places };
  });

  const settled = await Promise.all(promises);

  for (const { category, places } of settled) {
    results.set(category, places);
  }

  return results;
}

/**
 * 카카오 API 사용 가능 여부.
 * 키는 백엔드에서 관리하므로 프론트에서는 항상 시도하고,
 * 백엔드가 꺼져 있거나 키가 없으면 각 호출이 빈 배열로 자연히 폴백합니다.
 */
export function isKakaoSearchReady(): boolean {
  return true;
}
