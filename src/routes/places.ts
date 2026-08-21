import { Router, Request, Response } from 'express';
import { searchByKeyword } from '../services/kakao-api';

export const placesRouter = Router();

/**
 * GET /api/places/search?query=카페&lat=35.5&lng=129.3&radius=3000&size=5
 *
 * 카카오 로컬 API를 프록시하여 장소를 검색합니다.
 * 프론트엔드에서 API 키를 노출하지 않기 위해 백엔드를 거칩니다.
 */
placesRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, lat, lng, radius, size } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query 파라미터가 필요합니다.' });
    }

    const result = await searchByKeyword({
      query,
      y: lat as string | undefined,
      x: lng as string | undefined,
      radius: radius ? Number(radius) : undefined,
      size: size ? Number(size) : 5,
    });

    const places = result.documents.map((doc) => ({
      id: doc.id,
      name: doc.place_name,
      address: doc.road_address_name || doc.address_name,
      category: doc.category_name,
      latitude: parseFloat(doc.y),
      longitude: parseFloat(doc.x),
      phone: doc.phone || undefined,
      placeUrl: doc.place_url,
    }));

    res.json({
      success: true,
      places,
      total: result.meta.total_count,
    });
  } catch (error: any) {
    console.error('[Places] 검색 실패:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
