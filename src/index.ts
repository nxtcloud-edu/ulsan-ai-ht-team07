import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { placesRouter } from './routes/places';
import { courseRouter } from './routes/course';
import { kakaoRouter } from './routes/kakao';
import { naverRouter } from './routes/naver';

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json());

// 라우터
app.use('/api/places', placesRouter);
app.use('/api/course', courseRouter);
app.use('/api/kakao', kakaoRouter);
app.use('/api/naver', naverRouter);

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      kakao: !!process.env.KAKAO_REST_API_KEY,
      naver: !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
      openai: !!process.env.OPENAI_API_KEY,
    },
  });
});

app.listen(PORT, () => {
  console.log(`[일단나와 API] 서버 실행 중: http://localhost:${PORT}`);
  console.log(`[일단나와 API] 카카오 API: ${process.env.KAKAO_REST_API_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log(`[일단나와 API] OpenAI: ${process.env.OPENAI_API_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
});

export default app;
