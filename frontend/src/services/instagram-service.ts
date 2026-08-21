import { PlaceCategory } from '../types';

/**
 * 인스타그램 해시태그 링크 생성 서비스
 *
 * Meta Graph API 심사 없이 사용 가능한 방식:
 * - 장소명, 카테고리, 지역 기반으로 해시태그 키워드를 생성
 * - 인스타그램 해시태그 검색 URL을 만들어 유저가 직접 탐색할 수 있도록 연결
 *
 * 추후 Graph API 승인 시 실제 게시물 데이터 연동으로 확장 가능
 */

/** 카테고리별 인스타 해시태그 키워드 매핑 */
const CATEGORY_HASHTAGS: Record<PlaceCategory, string[]> = {
  restaurant: ['맛집', '먹스타그램', '맛스타그램', '밥스타그램'],
  cafe: ['카페', '카페스타그램', '카페투어', '디저트'],
  bowling: ['볼링', '볼링장'],
  escape_room: ['방탈출', '방탈출카페'],
  board_game: ['보드게임', '보드게임카페'],
  accessories_shop: ['소품샵', '악세사리'],
  keyring_shop: ['키링', '키링만들기'],
  craft_workshop: ['공방', '원데이클래스', '공방체험'],
  exhibition: ['전시회', '전시', '갤러리'],
  walk: ['산책', '걷기좋은곳', '산책스타그램'],
  karaoke: ['노래방', '코인노래방'],
  photo_studio: ['셀프사진관', '인생네컷', '포토부스'],
  bar: ['술집', '바', '칵테일바'],
  park: ['공원', '나들이', '피크닉'],
  shopping: ['쇼핑', '쇼핑몰'],
};

/** 지역별 인스타 해시태그 키워드 */
const REGION_HASHTAGS: Record<string, string[]> = {
  울산: ['울산', '울산광역시', '울산놀거리', '울산가볼만한곳'],
  '울산 남구': ['울산남구', '삼산동', '무거동'],
  '울산 중구': ['울산중구', '성남동', '울산중구맛집'],
  '울산 동구': ['울산동구', '일산동'],
  '울산 북구': ['울산북구'],
  '울산 울주군': ['울주군', '언양', '간절곶'],
};

/** 동네별 인스타 해시태그 */
const NEIGHBORHOOD_HASHTAGS: Record<string, string[]> = {
  무거동: ['울산대', '울대앞', '무거동맛집', '무거동카페'],
  삼산동: ['삼산동', '삼산맛집', '삼산카페', '롯데백화점울산'],
  성남동: ['성남동', '울산성남동', '성남동맛집', '울산번화가'],
  일산동: ['일산동', '울산동구맛집'],
  대왕암: ['대왕암', '대왕암공원', '울산바다'],
  울주군: ['울주군', '언양맛집', '간절곶'],
};

/**
 * 장소에 맞는 인스타그램 해시태그 키워드를 생성합니다.
 *
 * @param placeName - 장소명
 * @param category - 장소 카테고리
 * @param neighborhood - 동네명
 * @param region - 지역명 (예: "울산")
 */
export function generateInstagramKeywords(
  placeName: string,
  category: PlaceCategory,
  neighborhood: string,
  region: string = '울산'
): string[] {
  const keywords: string[] = [];

  // 1. 장소명 자체를 해시태그로 (공백/특수문자 제거)
  const cleanName = placeName.replace(/[^가-힣a-zA-Z0-9]/g, '');
  if (cleanName.length >= 2) {
    keywords.push(cleanName);
  }

  // 2. 동네 + 카테고리 조합 (예: "무거동맛집", "삼산카페")
  const neighborhoodTags = NEIGHBORHOOD_HASHTAGS[neighborhood] || [];
  keywords.push(...neighborhoodTags.slice(0, 2));

  // 3. 카테고리 해시태그
  const categoryTags = CATEGORY_HASHTAGS[category] || [];
  keywords.push(...categoryTags.slice(0, 2));

  // 4. 지역 해시태그
  const regionTags = REGION_HASHTAGS[region] || REGION_HASHTAGS['울산'] || [];
  keywords.push(...regionTags.slice(0, 1));

  // 중복 제거
  return [...new Set(keywords)];
}

/**
 * 인스타그램 해시태그 검색 URL을 생성합니다.
 * 가장 관련도 높은 단일 해시태그로 검색 페이지를 연결합니다.
 *
 * @param keyword - 해시태그 키워드 (# 없이)
 */
export function getInstagramHashtagUrl(keyword: string): string {
  const cleanKeyword = keyword.replace(/[#\s]/g, '');
  return `https://www.instagram.com/explore/tags/${encodeURIComponent(cleanKeyword)}/`;
}

/**
 * 장소에 가장 적합한 인스타그램 해시태그 검색 URL을 생성합니다.
 * 동네명+카테고리 조합을 우선으로 사용합니다.
 *
 * @param placeName - 장소명
 * @param category - 장소 카테고리
 * @param neighborhood - 동네명
 */
export function getBestInstagramUrl(
  placeName: string,
  category: PlaceCategory,
  neighborhood: string
): string {
  // 우선순위: 장소명 그대로 > 동네+카테고리 > 동네명
  const cleanName = placeName.replace(/[^가-힣a-zA-Z0-9]/g, '');

  // 장소명이 충분히 고유하면 (3글자 이상) 장소명으로 검색
  if (cleanName.length >= 3) {
    return getInstagramHashtagUrl(cleanName);
  }

  // 아니면 동네 + 카테고리 키워드로
  const categoryMap: Partial<Record<PlaceCategory, string>> = {
    restaurant: '맛집',
    cafe: '카페',
    bar: '술집',
    craft_workshop: '공방',
    photo_studio: '셀프사진관',
  };

  const catKeyword = categoryMap[category];
  if (catKeyword && neighborhood) {
    return getInstagramHashtagUrl(`${neighborhood}${catKeyword}`);
  }

  return getInstagramHashtagUrl(neighborhood || '울산');
}
