import { Router, Request, Response } from 'express';
import { searchByKeyword } from '../services/kakao-api';

export const kakaoRouter = Router();

/**
 * GET /api/kakao/local/keyword
 *
 * 카카오 로컬 키워드 검색 API를 그대로 프록시합니다 (원본 응답 형태 유지).
 * 프론트엔드에서 기존에 직접 호출하던 것과 동일한 요청/응답 형태를 제공해서
 * 프론트 코드는 fetch 경로만 백엔드로 바꾸면 되도록 합니다.
 */
kakaoRouter.get('/local/keyword', async (req: Request, res: Response) => {
  try {
    const { query, x, y, radius, page, size, sort } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query 파라미터가 필요합니다.' });
    }

    const result = await searchByKeyword({
      query,
      x: x as string | undefined,
      y: y as string | undefined,
      radius: radius ? Number(radius) : undefined,
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined,
      sort: sort === 'distance' ? 'distance' : 'accuracy',
    });

    res.json(result);
  } catch (error: any) {
    console.error('[Kakao] 검색 실패:', error.message);
    res.status(502).json({ error: '카카오 API 호출에 실패했습니다.' });
  }
});
