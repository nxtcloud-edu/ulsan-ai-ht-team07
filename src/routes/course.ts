import { Router, Request, Response } from 'express';
import { generateCourse } from '../services/recommendation';
import { CourseRequest } from '../types';

export const courseRouter = Router();

/**
 * POST /api/course/generate
 *
 * 사용자 조건을 받아 코스를 생성합니다.
 *
 * Body: CourseRequest
 */
courseRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const request: CourseRequest = req.body;

    // 필수 필드 검증
    if (!request.location) {
      return res.status(400).json({ success: false, error: 'location이 필요합니다.' });
    }
    if (!request.startTime) {
      return res.status(400).json({ success: false, error: 'startTime이 필요합니다.' });
    }

    const result = await generateCourse(request);
    res.json(result);
  } catch (error: any) {
    console.error('[Course] 생성 실패:', error.message);
    res.status(500).json({ success: false, error: '코스 생성 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/course/modify
 *
 * 기존 코스의 특정 장소를 교체합니다.
 * (TODO: 구현 예정)
 */
courseRouter.post('/modify', async (req: Request, res: Response) => {
  res.status(501).json({ success: false, error: '아직 구현되지 않았습니다.' });
});
