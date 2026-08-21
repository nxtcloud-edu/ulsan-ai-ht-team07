# 일단나와

> 약속만 잡으세요. 계획은 일단나와가 짜드립니다.

AI 기반 지역 여가 코스 추천 서비스입니다. 사용자가 동행자, 지역, 시간, 예산, 취향을 입력하면 식당·카페·볼링장·방탈출·소품샵 등을 하나의 코스로 조합하여 "오늘 갈 코스"를 대신 결정해줍니다.

## 주요 기능

- **코스 자동 생성**: 조건 입력 후 최적의 코스 1개를 즉시 제안
- **빠른 추천**: "지금 친구랑", "오늘 데이트" 등 프리셋으로 즉시 코스 생성
- **부분 수정**: 밥집만 교체, 활동만 변경 등 나머지 일정 유지하며 특정 장소만 교체
- **자연어 수정**: "볼링 말고 소품샵 추가해줘" 같은 텍스트로 코스 수정
- **코스 저장/공유**: localStorage 기반 저장, 클립보드/공유 기능
- **지도 연동**: 카카오맵 외부 링크로 장소 확인

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite 5 |
| 스타일링 | Tailwind CSS 3 |
| 상태 관리 | React Context + useReducer |
| 저장소 | localStorage |
| 추천 엔진 | 규칙 기반 점수화 (AI API 확장 가능) |
| 지도 | 카카오맵 외부 링크 (API 확장 가능) |

## 설치 및 실행

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
cd ildan-nawa
npm install
```

### 환경 변수 설정 (선택)

```bash
cp .env.example .env
```

`.env` 파일에서 필요한 API 키를 설정합니다. **API 키 없이도 모든 기능이 동작합니다.**

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속합니다.

### 빌드

```bash
npm run build
```

`dist/` 폴더에 빌드 결과물이 생성됩니다.

## 프로젝트 구조

```
src/
├── components/          # UI 컴포넌트
│   ├── Header.tsx
│   ├── CompanionSelector.tsx
│   ├── LocationSelector.tsx
│   ├── TimeSelector.tsx
│   ├── BudgetSelector.tsx
│   ├── ActivityTags.tsx
│   ├── AvoidanceTags.tsx
│   ├── QuickRecommendation.tsx
│   ├── CourseTimeline.tsx
│   ├── PlaceCard.tsx
│   ├── CourseSummary.tsx
│   ├── CourseEditActions.tsx
│   ├── SavedCourseList.tsx
│   ├── HomeView.tsx
│   ├── ResultView.tsx
│   ├── ErrorView.tsx
│   └── LoadingOverlay.tsx
├── context/             # React Context 상태 관리
│   └── AppContext.tsx
├── data/                # 장소 데이터 (도시별 분리)
│   ├── index.ts
│   └── places-ulsan.ts
├── services/            # 비즈니스 로직
│   ├── recommendation-engine.ts  # 추천 알고리즘
│   ├── ai-service.ts             # AI 서비스 레이어
│   ├── map-service.ts            # 지도 서비스
│   └── quick-presets.ts          # 빠른 추천 프리셋
├── types/               # TypeScript 타입 정의
│   └── index.ts
├── utils/               # 유틸리티 함수
│   ├── time.ts          # 시간 계산
│   ├── distance.ts      # 거리/이동시간 계산
│   └── cost.ts          # 비용 계산
├── App.tsx
├── main.tsx
└── index.css
```

## 추천 알고리즘

규칙 기반 점수화 시스템으로 다음 요소를 평가합니다:

1. 동행자 적합도 (30점)
2. 예산 적합도 (20점)
3. 인원수 수용 가능 여부 (필수)
4. 원하는 활동 일치도 (25점)
5. 피하고 싶은 조건 위반 여부 (필수 제외)
6. 이동거리 (15점)
7. 실내/야외 조건 (5점)
8. 주차 여부 (10점)
9. 카테고리 다양성 (-20점 중복)
10. 분위기 매칭 (10점)

## 도시 추가 방법

1. `src/data/places-[city].ts` 파일 생성
2. `src/data/index.ts`에서 import 및 `cityPlaces` 레지스트리에 등록
3. `locationPresetMap`에 해당 도시 지역 프리셋 추가

## 시연 시나리오

### 시나리오 1: 친구 3명, 울산대 근처
- 동행자: 친구 / 인원: 3명
- 지역: 울산대학교·무거동
- 시간: 17:00~21:30 / 예산: 4만 원
- 원하는 활동: 식사, 활동적인 체험, 소품샵
- 피하고 싶은 조건: 술, 긴 웨이팅

### 시나리오 2: 부모님과 나들이
- 동행자: 부모님 / 인원: 3명
- 이동수단: 자동차 / 예산: 5만 원
- 피하고 싶은 조건: 많이 걷기, 시끄러운 장소

### 시나리오 3: 직장동료 단체
- 동행자: 직장동료 / 인원: 6명
- 지역: 삼산동
- 시간: 19:00~23:00
- 원하는 활동: 식사, 활동적인 체험

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `VITE_AI_API_KEY` | AI API 키 (선택) | - |
| `VITE_AI_API_URL` | AI API URL (선택) | - |
| `VITE_MAP_API_KEY` | 지도 API 키 (선택) | - |
| `VITE_MAP_API_TYPE` | 지도 서비스 유형 | kakao |

## 참고사항

- 이 프로젝트는 MVP 단계로, 장소 데이터는 샘플입니다
- 실제 서비스 시 장소 데이터를 실제 정보로 교체해야 합니다
- AI API 키가 없어도 규칙 기반 추천으로 모든 기능이 동작합니다
- 외부 서비스 데이터를 무단 크롤링하지 않으며, 공식 API 또는 관리자 등록 데이터만 사용합니다

## 라이선스

Private - All rights reserved
