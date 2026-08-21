/**
 * 네이버 블로그 검색 API 서비스 (백엔드)
 *
 * Client ID/Secret을 서버에서만 관리하여 클라이언트에 노출되지 않도록 합니다.
 */

const NAVER_API_BASE = 'https://openapi.naver.com';

export interface NaverBlogSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: Array<{
    title: string;
    link: string;
    description: string;
    bloggername: string;
    bloggerlink: string;
    postdate: string;
  }>;
}

export async function searchBlog(params: {
  query: string;
  display?: number;
  start?: number;
  sort?: 'sim' | 'date';
}): Promise<NaverBlogSearchResponse> {
  const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
  const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    throw new Error('NAVER_CLIENT_ID/NAVER_CLIENT_SECRET이 설정되지 않았습니다.');
  }

  const searchParams = new URLSearchParams({
    query: params.query,
    display: String(params.display || 3),
    start: String(params.start || 1),
    sort: params.sort || 'sim',
  });

  const response = await fetch(`${NAVER_API_BASE}/v1/search/blog.json?${searchParams.toString()}`, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`네이버 API 오류 (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<NaverBlogSearchResponse>;
}
