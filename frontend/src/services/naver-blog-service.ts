import { NaverBlogReview } from '../types';

/**
 * 네이버 블로그 검색 API 서비스
 *
 * 네이버 개발자센터(https://developers.naver.com)에서
 * 애플리케이션 등록 후 Client ID / Secret 발급 필요
 *
 * API 문서: https://developers.naver.com/docs/serviceapi/search/blog/blog.md
 *
 * [제한사항]
 * - 하루 25,000건 호출 가능 (무료)
 * - Client ID/Secret은 백엔드(ildan-nawa-backend)에서만 관리하며,
 *   프론트는 `/api/naver/blog` 백엔드 프록시를 호출합니다.
 */

interface NaverBlogApiResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverBlogApiItem[];
}

interface NaverBlogApiItem {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  bloggerlink: string;
  postdate: string; // "yyyyMMdd" 형식
}

/** HTML 태그 제거 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, '');
}

/** postdate를 "YYYY-MM-DD" 형식으로 변환 */
function formatPostDate(postdate: string): string {
  if (postdate.length === 8) {
    return `${postdate.slice(0, 4)}-${postdate.slice(4, 6)}-${postdate.slice(6, 8)}`;
  }
  return postdate;
}

/**
 * 네이버 블로그에서 장소 후기를 검색합니다.
 *
 * @param placeName - 장소명
 * @param region - 지역명 (예: "울산", "울산 남구")
 * @param count - 가져올 후기 수 (기본 3개)
 */
export async function searchNaverBlogReviews(
  placeName: string,
  region: string,
  count: number = 3
): Promise<NaverBlogReview[]> {
  const query = `${placeName} ${region} 후기`;

  try {
    // 백엔드 프록시를 통해 호출 (Client ID/Secret은 백엔드에서 부착)
    const params = new URLSearchParams({
      query,
      display: String(count),
      start: '1',
      sort: 'sim', // 정확도순 (sim) 또는 최신순 (date)
    });

    const response = await fetch(`/api/naver/blog?${params.toString()}`);

    if (!response.ok) {
      console.error('[NaverBlog] API 응답 오류:', response.status);
      return [];
    }

    const data: NaverBlogApiResponse = await response.json();

    return data.items.map((item) => ({
      title: stripHtml(item.title),
      description: stripHtml(item.description),
      link: item.link,
      bloggerName: item.bloggername,
      postDate: formatPostDate(item.postdate),
    }));
  } catch (error) {
    console.error('[NaverBlog] 검색 실패:', error);
    return [];
  }
}

/**
 * 네이버 검색 URL을 생성합니다 (후기 직접 검색 링크).
 * API 키 없이도 사용 가능합니다.
 */
export function getNaverSearchUrl(placeName: string, region: string): string {
  const query = encodeURIComponent(`${placeName} ${region} 후기`);
  return `https://search.naver.com/search.naver?where=blog&query=${query}`;
}

/**
 * 네이버 API 사용 가능 여부.
 * 키는 백엔드에서 관리하므로 프론트에서는 항상 시도하고,
 * 백엔드가 꺼져 있거나 키가 없으면 호출이 빈 배열로 자연히 폴백합니다.
 */
export function isNaverApiConfigured(): boolean {
  return true;
}
