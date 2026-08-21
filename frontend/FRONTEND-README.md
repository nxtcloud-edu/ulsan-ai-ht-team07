# 일단나와 프론트엔드

울산 지역 여가 코스 추천 서비스의 프론트엔드입니다.

## 기술 스택

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **상태관리**: React Context + useReducer

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

`.env` 내용:
```
VITE_KAKAO_REST_API_KEY=카카오_REST_API_키
VITE_KAKAO_JS_KEY=카카오_JavaScript_키
VITE_APP_CITY=ulsan
VITE_APP_ENV=development
```

### 3. 개발 서버 실행

```bash
npm run dev -- --host
```

`http://localhost:5173` (또는 5174)에서 확인 가능.

### 4. 빌드

```bash
npm run build
```

`dist/` 폴더에 빌드 결과물이 생성됩니다.

## 프로젝트 구조

```
src/
├── main.tsx                  # 앱 진입점
├── App.tsx                   # 최상위 컴포넌트
├── index.css                 # 글로벌 스타일 (Tailwind)
│
├── components/               # UI 컴포넌트
│   ├── HomeView.tsx          # 메인 화면 (조건 입력)
│   ├── ResultView.tsx        # 코스 결과 화면
│   ├── ChatView.tsx          # 대화형 코스 생성
│   ├── PlaceCard.tsx         # 장소 카드 (후기 링크 포함)
│   ├── CourseTimeline.tsx    # 코스 타임라인
│   ├── CourseSummary.tsx     # 코스 요약 정보
│   ├── CourseEditActions.tsx  # 코스 수정 버튼들
│   ├── LocationSelector.tsx  # 지역 + 출발지 + 꼭 가고 싶은 곳
│   ├── CompanionSelector.tsx # 동행자 선택
│   ├── TimeSelector.tsx      # 시간 선택
│   ├── BudgetSelector.tsx    # 예산 선택
│   ├── ActivityTags.tsx      # 활동 태그 선택
│   ├── AvoidanceTags.tsx     # 피하고 싶은 조건
│   ├── QuickRecommendation.tsx # 빠른 추천 프리셋
│   ├── SavedCourseList.tsx   # 저장된 코스 목록
│   ├── Header.tsx            # 상단 헤더
│   ├── LoadingOverlay.tsx    # 로딩 화면
│   └── ErrorView.tsx         # 에러 화면
│
├── context/
│   └── AppContext.tsx        # 전역 상태 관리 (Context + Reducer)
│
├── services/                 # 비즈니스 로직 / API 호출
│   ├── index.ts              # 서비스 export 모음
│   ├── recommendation-engine.ts  # 추천 엔진 (코스 생성 로직)
│   ├── kakao-place-search.ts     # 카카오 API로 실제 장소 검색
│   ├── kakao-local-service.ts    # 카카오 로컬 API 기본 호출
│   ├── kakao-share-service.ts    # 카카오톡 공유
│   ├── naver-blog-service.ts     # 네이버 블로그 검색
│   ├── instagram-service.ts      # 인스타 해시태그 링크 생성
│   ├── external-data-service.ts  # 외부 데이터 통합 (enrich)
│   ├── ai-service.ts             # AI 자연어 파싱
│   ├── map-service.ts            # 지도 서비스
│   └── quick-presets.ts          # 빠른 추천 프리셋 데이터
│
├── data/                     # 정적 데이터 (샘플, 폴백용)
│   ├── index.ts
│   └── places-ulsan.ts      # 울산 샘플 장소 데이터
│
├── types/
│   └── index.ts              # 전체 타입 정의
│
└── utils/                    # 유틸리티 함수
    ├── index.ts
    ├── cost.ts               # 비용 포맷
    ├── distance.ts           # 거리/이동시간 계산
    └── time.ts               # 시간 계산
```

## 주요 기능

### 1. 코스 생성
- 조건 입력 (동행자, 지역, 시간, 예산, 활동)
- 출발지 검색 (카카오 API 실시간 검색)
- 꼭 가고 싶은 장소 설정 (최대 3곳)
- 카카오 API로 실제 장소 기반 코스 생성

### 2. 후기 연동
- 네이버 블로그 후기 링크
- 카카오맵 후기 링크
- 인스타그램 해시태그 링크
- (API 키 있으면) 블로그 후기 미리보기

### 3. 공유
- 카카오톡 공유 (SDK)
- 코스 로컬 저장

### 4. 대화형 코스 생성
- 자연어로 조건 입력 → 코스 생성
- "볼링 빼줘", "예산 줄여줘" 등 수정 요청

## 백엔드 연동 (향후)

현재는 프론트에서 직접 카카오 API를 호출하지만,
백엔드 분리 후에는 `vite.config.ts` 프록시만 변경하면 됩니다:

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:3001', // 백엔드 서버로 연결
  },
}
```

## 카카오 개발자센터 설정 필요

1. https://developers.kakao.com → 앱 생성
2. **카카오맵** 활성화 (ON)
3. **플랫폼** → Web 도메인 추가: `http://localhost:5174`
4. REST API 키 / JavaScript 키 → `.env`에 입력

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run dev -- --host` | 네트워크 접근 가능하게 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과물 미리보기 |
