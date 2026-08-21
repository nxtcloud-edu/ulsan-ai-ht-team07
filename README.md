# 일단나와 백엔드 API

울산 지역 여가 코스 추천 서비스의 백엔드 서버입니다.

## 역할

- 카카오 로컬 API 프록시 (API 키 보호)
- 코스 추천 엔진 (장소 검색 → 점수화 → 코스 구성)
- (예정) AI 추천 멘트 생성 (OpenAI)
- (예정) 사용자 코스 저장/조회 (DB)

## 기술 스택

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **외부 API**: 카카오 로컬 API, (선택) OpenAI

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사해서 `.env` 파일을 만들어주세요:

```bash
cp .env.example .env
```

`.env` 파일에 카카오 REST API 키를 넣어주세요:

```
PORT=3001
KAKAO_REST_API_KEY=발급받은_카카오_REST_API_키
OPENAI_API_KEY=
FRONTEND_URL=http://localhost:5174
```

### 3. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

### 4. 빌드 & 배포

```bash
npm run build
npm start
```

## API 엔드포인트

### `GET /api/health`
서버 상태 확인

### `GET /api/places/search`
장소 검색 (카카오 API 프록시)

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| query | ✅ | 검색어 (예: "울산 삼산동 맛집") |
| lat | | 위도 (가까운 순 정렬) |
| lng | | 경도 |
| radius | | 반경 (미터, 최대 20000) |
| size | | 결과 수 (기본 5) |

### `POST /api/course/generate`
코스 생성

Request Body:
```json
{
  "companion": "friend",
  "location": "samsan",
  "groupSize": 3,
  "startTime": "now",
  "endTime": "21:00",
  "budgetPerPerson": 30000,
  "transport": "walk",
  "desiredActivities": ["먹기", "카페"],
  "avoidConditions": [],
  "startCoords": { "latitude": 35.54, "longitude": 129.33 },
  "mustVisitPlaces": [
    { "name": "초석로스터스", "kakaoId": "123456", "latitude": 35.53, "longitude": 129.33 }
  ]
}
```

Response:
```json
{
  "success": true,
  "course": {
    "id": "course-1234567890",
    "stops": [...],
    "totalCostPerPerson": 28000,
    "totalTravelTime": 15,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 프로젝트 구조

```
src/
├── index.ts              # 서버 진입점
├── routes/
│   ├── places.ts         # 장소 검색 API
│   └── course.ts         # 코스 생성/수정 API
├── services/
│   ├── kakao-api.ts      # 카카오 로컬 API 호출
│   └── recommendation.ts # 추천 엔진 로직
└── types/
    └── index.ts          # 타입 정의
```

## 프론트엔드 연동

프론트엔드(`ildan-nawa`)에서 이 백엔드를 호출할 때:

1. 프론트의 `vite.config.ts`에서 프록시를 백엔드로 변경:
```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001',
  },
}
```

2. 또는 프론트에서 직접 `http://localhost:3001/api/...` 호출

## TODO

- [ ] AI 추천 멘트 생성 (OpenAI 연동)
- [ ] 코스 수정 API (`POST /api/course/modify`)
- [ ] 사용자 코스 저장 (MongoDB 또는 PostgreSQL)
- [ ] 장소 데이터 캐싱 (Redis)
- [ ] 배포 (Vercel / Railway / AWS)
