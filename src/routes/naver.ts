import { Router, Request, Response } from 'express';
import { searchBlog } from '../services/naver-api';

export const naverRouter = Router();

/**
 * GET /api/naver/blog
 *
 * 네이버 블로그 검색 API를 그대로 프록시합니다 (원본 응답 형태 유지).
 */
naverRouter.get('/blog', async (req: Request, res: Response) => {
  try {
    const { query, display, start, sort } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query 파라미터가 필요합니다.' });
    }

    const result = await searchBlog({
      query,
      display: display ? Number(display) : undefined,
      start: start ? Number(start) : undefined,
      sort: sort === 'date' ? 'date' : 'sim',
    });

    res.json(result);
  } catch (error: any) {
    console.error('[Naver] 검색 실패:', error.message);
    res.status(502).json({ error: '네이버 API 호출에 실패했습니다.' });
  }
});
