import { Course, CourseStop, PlaceExternalData } from '../types';
import { searchNaverBlogReviews, getNaverSearchUrl, isNaverApiConfigured } from './naver-blog-service';
import { findKakaoPlace, isKakaoApiConfigured } from './kakao-local-service';
import { getBestInstagramUrl, generateInstagramKeywords } from './instagram-service';

/**
 * 외부 데이터 통합 서비스
 *
 * 코스가 생성된 후, 각 장소에 네이버 블로그 후기/카카오맵 정보/인스타 링크를
 * 비동기로 채워주는 역할을 합니다.
 *
 * 동작 방식:
 * 1. 코스 생성 (동기, 즉시 반환)
 * 2. 외부 데이터 enrich (비동기, 점진적 업데이트)
 *    - API 키가 있으면 실제 API 호출
 *    - API 키가 없으면 검색 URL만 생성 (항상 동작)
 */

/**
 * 단일 장소에 대한 외부 데이터를 수집합니다.
 */
export async function fetchExternalDataForPlace(
  placeName: string,
  neighborhood: string,
  city: string,
  category: string,
  coords?: { latitude: number; longitude: number }
): Promise<PlaceExternalData> {
  const region = city === 'ulsan' ? '울산' : city;
  const externalData: PlaceExternalData = {
    fetchedAt: new Date().toISOString(),
  };

  // 1. 인스타그램 (항상 생성 가능 - API 불필요)
  externalData.instagramHashtagUrl = getBestInstagramUrl(
    placeName,
    category as any,
    neighborhood
  );
  externalData.instagramKeywords = generateInstagramKeywords(
    placeName,
    category as any,
    neighborhood,
    region
  );

  // 2. 네이버 검색 URL (항상 생성 가능)
  externalData.naverSearchUrl = getNaverSearchUrl(placeName, region);

  // 3. 네이버 블로그 API (키가 있을 때만)
  if (isNaverApiConfigured()) {
    try {
      const reviews = await searchNaverBlogReviews(placeName, region, 3);
      if (reviews.length > 0) {
        externalData.naverBlogReviews = reviews;
      }
    } catch (err) {
      console.warn(`[ExternalData] 네이버 블로그 검색 실패: ${placeName}`, err);
    }
  }

  // 4. 카카오 로컬 API (키가 있을 때만)
  if (isKakaoApiConfigured()) {
    try {
      const kakaoPlace = await findKakaoPlace(placeName, region, coords);
      if (kakaoPlace) {
        externalData.kakaoPlace = kakaoPlace;
      }
    } catch (err) {
      console.warn(`[ExternalData] 카카오 장소 검색 실패: ${placeName}`, err);
    }
  }

  return externalData;
}

/**
 * 코스 전체의 장소에 외부 데이터를 채워 반환합니다.
 * 각 장소를 병렬로 처리하여 속도를 높입니다.
 *
 * @param course - 생성된 코스
 * @param onStopUpdated - 개별 장소 업데이트 시 콜백 (점진적 UI 업데이트용)
 */
export async function enrichCourseWithExternalData(
  course: Course,
  onStopUpdated?: (stopIndex: number, stop: CourseStop) => void
): Promise<Course> {
  const enrichedStops = await Promise.all(
    course.stops.map(async (stop, index) => {
      const externalData = await fetchExternalDataForPlace(
        stop.place.name,
        stop.place.neighborhood,
        stop.place.city,
        stop.place.category,
        { latitude: stop.place.latitude, longitude: stop.place.longitude }
      );

      const enrichedStop: CourseStop = {
        ...stop,
        place: {
          ...stop.place,
          externalData,
        },
      };

      // 점진적 업데이트 콜백
      if (onStopUpdated) {
        onStopUpdated(index, enrichedStop);
      }

      return enrichedStop;
    })
  );

  return {
    ...course,
    stops: enrichedStops,
  };
}

/**
 * API 연동 상태를 확인합니다.
 */
export function getExternalApiStatus() {
  return {
    naver: isNaverApiConfigured(),
    kakao: isKakaoApiConfigured(),
    instagram: true, // 항상 사용 가능 (URL 링크 방식)
  };
}
