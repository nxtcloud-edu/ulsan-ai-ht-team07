// ===== 장소 관련 타입 =====

export type CompanionType = 'solo' | 'couple' | 'friend' | 'parent' | 'coworker';

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'bowling'
  | 'escape_room'
  | 'board_game'
  | 'accessories_shop'
  | 'keyring_shop'
  | 'craft_workshop'
  | 'exhibition'
  | 'walk'
  | 'karaoke'
  | 'photo_studio'
  | 'bar'
  | 'park'
  | 'shopping';

export type MoodTag =
  | '조용한'
  | '활동적인'
  | '사진 찍기 좋은'
  | '대화하기 좋은'
  | '단체 방문'
  | '가성비'
  | '이색적인'
  | '부모님과 가기 좋은'
  | '로맨틱한'
  | '힙한';

export type ActivityTag =
  | '식사'
  | '디저트'
  | '볼링'
  | '방탈출'
  | '보드게임'
  | '소품샵'
  | '키링'
  | '공방'
  | '전시'
  | '산책'
  | '사진'
  | '노래방'
  | '술';

export interface OpeningHours {
  open: string; // "HH:mm" 형식
  close: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface Place {
  id: string;
  name: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  subCategory?: string;
  description: string;
  suitableFor: CompanionType[];
  moodTags: MoodTag[];
  activityTags: ActivityTag[];
  indoor: boolean;
  parking: boolean;
  groupSizeMin: number;
  groupSizeMax: number;
  averageCost: number; // 1인당 평균 비용 (원)
  averageDuration: number; // 평균 체류 시간 (분)
  openingHours: Record<string, OpeningHours>; // 요일별
  closedDays: number[]; // 0=일, 1=월, ..., 6=토
  reservationRequired: boolean;
  mapUrl: string;
  imageUrl?: string;
  featured: boolean;
  verified: boolean;
  lastUpdated: string;
  isSample?: boolean; // MVP 샘플 데이터 표시

  // 외부 리뷰/링크 데이터 (API 연동)
  externalData?: PlaceExternalData;
}

// ===== 외부 데이터 관련 타입 =====

export interface NaverBlogReview {
  title: string;
  description: string;
  link: string;
  bloggerName: string;
  postDate: string;
}

export interface KakaoPlaceInfo {
  kakaoId: string;
  placeName: string;
  phone?: string;
  addressName: string;
  roadAddressName?: string;
  categoryName: string;
  placeUrl: string; // 카카오맵 상세 페이지 (후기 포함)
  latitude: number;
  longitude: number;
}

export interface PlaceExternalData {
  // 네이버 블로그 후기
  naverBlogReviews?: NaverBlogReview[];
  naverSearchUrl?: string; // "장소명 울산 후기" 네이버 검색 링크

  // 카카오맵 정보
  kakaoPlace?: KakaoPlaceInfo;

  // 인스타그램 해시태그 링크
  instagramHashtagUrl?: string; // 인스타 해시태그 검색 링크
  instagramKeywords?: string[]; // 사용된 해시태그 키워드

  // 메타 정보
  fetchedAt?: string; // 데이터 조회 시각
}

// ===== 사용자 입력 관련 타입 =====

export type TransportType = 'walk' | 'public' | 'car' | 'any';

export type DesiredActivity =
  | '먹기'
  | '카페'
  | '활동적인 체험'
  | '소품샵'
  | '사진'
  | '산책'
  | '문화생활'
  | '술'
  | '랜덤';

export type AvoidCondition =
  | '긴 웨이팅'
  | '야외'
  | '술'
  | '매운 음식'
  | '많이 걷기'
  | '시끄러운 장소';

export type LocationPreset =
  | 'ulsan_univ'
  | 'samsan'
  | 'seongnam'
  | 'ilsan_daewangam'
  | 'ulju'
  | 'custom';

export interface UserPreferences {
  companion: CompanionType;
  location: LocationPreset;
  customLocation?: string;
  groupSize: number;
  startTime: string; // "HH:mm" 또는 "now"
  endTime?: string; // 미설정시 startTime + 3시간
  budgetPerPerson: number | null; // null = 상관없음
  transport: TransportType;
  desiredActivities: DesiredActivity[];
  avoidConditions: AvoidCondition[];
  additionalRequest?: string;

  // 출발지 / 꼭 가고 싶은 장소
  startPlaceName?: string; // 출발지 장소명
  startCoords?: { latitude: number; longitude: number }; // 출발지 좌표
  mustVisitPlaces?: MustVisitPlace[]; // 꼭 가고 싶은 장소 목록
}

export interface MustVisitPlace {
  name: string; // 장소명
  kakaoId?: string;
  latitude?: number;
  longitude?: number;
  placeUrl?: string;
}

// ===== 코스 관련 타입 =====

export interface CourseStop {
  id: string;
  place: Place;
  startTime: string; // "HH:mm"
  endTime: string;
  duration: number; // 분
  estimatedCost: number; // 1인당
  distanceFromPrev: number; // 미터
  travelTimeFromPrev: number; // 분
  recommendReason: string;
  order: number;
}

export interface Course {
  id: string;
  stops: CourseStop[];
  totalCostPerPerson: number;
  totalTravelTime: number; // 분
  totalDuration: number; // 분
  indoorRatio: number; // 0~1
  preferences: UserPreferences;
  createdAt: string;
  savedAt?: string;
  name?: string;
}

// ===== 코스 수정 관련 타입 =====

export type CourseEditType =
  | 'change_restaurant'
  | 'change_activity'
  | 'remove_cafe'
  | 'reduce_distance'
  | 'reduce_budget'
  | 'indoor_only'
  | 'regenerate_all'
  | 'custom';

export interface CourseEditRequest {
  type: CourseEditType;
  targetStopId?: string;
  customRequest?: string;
  currentCourse: Course;
}

// ===== 빠른 추천 관련 타입 =====

export type QuickPreset =
  | 'friend_now'
  | 'date_today'
  | 'parent_outing'
  | 'after_work'
  | 'solo_time'
  | 'rainy_day'
  | 'budget'
  | 'random';

// ===== 추천 결과 관련 타입 =====

export interface RecommendationResult {
  success: boolean;
  course?: Course;
  error?: RecommendationError;
}

export interface RecommendationError {
  type: 'no_places' | 'no_open_places' | 'budget_too_low' | 'time_too_short' | 'no_matching';
  message: string;
  suggestions: RelaxSuggestion[];
}

export interface RelaxSuggestion {
  label: string;
  action: () => UserPreferences;
}

// ===== 앱 상태 =====

export type AppView = 'home' | 'result' | 'saved' | 'chat';

export interface AppState {
  currentView: AppView;
  preferences: UserPreferences;
  currentCourse: Course | null;
  savedCourses: Course[];
  isLoading: boolean;
  error: RecommendationError | null;
}
