/**
 * 추천 알고리즘 엔진
 * 
 * 규칙 기반 점수화 시스템으로 사용자 조건에 맞는 코스를 생성합니다.
 * 향후 AI API 기반 추천 시스템으로 교체 가능하도록 인터페이스를 분리합니다.
 */

import {
  Place,
  UserPreferences,
  Course,
  CourseStop,
  RecommendationResult,
  RecommendationError,
  PlaceCategory,
  DesiredActivity,
  AvoidCondition,
} from '../types';
import { getPlacesByCity, locationPresetMap } from '../data';
import {
  timeToMinutes,
  addMinutes,
  getAvailableMinutes,
  getCurrentTime,
  getCurrentDayOfWeek,
  canVisitDuring,
} from '../utils/time';
import { calculateDistance, estimateTravelTime } from '../utils/distance';
import { searchRealPlacesByCategories, isKakaoSearchReady } from './kakao-place-search';

// ===== 상수 =====

/** 활동 태그와 장소 카테고리 매핑 */
const ACTIVITY_TO_CATEGORY: Record<DesiredActivity, PlaceCategory[]> = {
  '먹기': ['restaurant'],
  '카페': ['cafe'],
  '활동적인 체험': ['bowling', 'escape_room', 'board_game', 'karaoke'],
  '소품샵': ['accessories_shop', 'keyring_shop'],
  '사진': ['photo_studio'],
  '산책': ['walk', 'park'],
  '문화생활': ['exhibition', 'craft_workshop'],
  '술': ['bar'],
  '랜덤': [],
};

/** 피하고 싶은 조건과 필터링 로직 */
const AVOID_FILTERS: Record<AvoidCondition, (place: Place) => boolean> = {
  '긴 웨이팅': (p) => p.reservationRequired,
  '야외': (p) => !p.indoor,
  '술': (p) => p.category === 'bar' || p.activityTags.includes('술'),
  '매운 음식': (p) => p.subCategory?.includes('매운') || false,
  '많이 걷기': (p) => p.category === 'walk' || p.category === 'park',
  '시끄러운 장소': (p) => p.category === 'karaoke' || p.category === 'bowling',
};

/** 코스 흐름 패턴 (카테고리 우선순위) */
const COURSE_FLOW_PATTERNS: PlaceCategory[][] = [
  ['restaurant', 'bowling', 'accessories_shop', 'cafe'],
  ['restaurant', 'escape_room', 'photo_studio', 'cafe'],
  ['restaurant', 'board_game', 'accessories_shop', 'cafe'],
  ['cafe', 'exhibition', 'restaurant', 'walk'],
  ['restaurant', 'walk', 'cafe', 'photo_studio'],
  ['restaurant', 'karaoke', 'cafe'],
  ['restaurant', 'craft_workshop', 'cafe'],
];

// ===== 점수 계산 =====

interface ScoredPlace {
  place: Place;
  score: number;
  reasons: string[];
}

/** 장소별 점수 계산 */
function scorePlace(place: Place, prefs: UserPreferences, context: ScoringContext): ScoredPlace {
  let score = 0;
  const reasons: string[] = [];

  // 1. 동행자 적합도 (0~30점)
  if (place.suitableFor.includes(prefs.companion)) {
    score += 30;
    reasons.push(getCompanionReason(prefs.companion, place));
  } else {
    score -= 20;
  }

  // 2. 예산 적합도 (0~20점)
  if (prefs.budgetPerPerson !== null) {
    const remainingBudget = prefs.budgetPerPerson - context.currentTotalCost;
    if (place.averageCost <= remainingBudget) {
      score += 20;
      if (place.averageCost <= remainingBudget * 0.5) {
        reasons.push('전체 예산을 맞추기 위해 가격이 부담스럽지 않은 곳이에요.');
      }
    } else {
      score -= 50; // 예산 초과시 큰 감점
    }
  } else {
    score += 10;
  }

  // 3. 인원수 수용 (0 또는 제외)
  if (prefs.groupSize >= place.groupSizeMin && prefs.groupSize <= place.groupSizeMax) {
    score += 15;
  } else {
    return { place, score: -999, reasons: ['인원수 초과'] };
  }

  // 4. 원하는 활동 일치도 (0~25점)
  if (prefs.desiredActivities.length > 0) {
    const matchingActivities = prefs.desiredActivities.filter((activity) => {
      if (activity === '랜덤') return true;
      const categories = ACTIVITY_TO_CATEGORY[activity];
      return categories.includes(place.category);
    });
    if (matchingActivities.length > 0) {
      score += 25;
    }
  }

  // 5. 피하고 싶은 조건 (위반시 제외)
  for (const avoid of prefs.avoidConditions) {
    const filter = AVOID_FILTERS[avoid];
    if (filter && filter(place)) {
      return { place, score: -999, reasons: [`'${avoid}' 조건 위반`] };
    }
  }

  // 6. 이동거리 점수 (가까울수록 높음)
  if (context.lastPlace) {
    const distance = calculateDistance(
      context.lastPlace.latitude,
      context.lastPlace.longitude,
      place.latitude,
      place.longitude
    );
    const travelTime = estimateTravelTime(distance, prefs.transport);
    if (travelTime <= 10) score += 15;
    else if (travelTime <= 20) score += 10;
    else if (travelTime <= 30) score += 5;
    else score -= 5;

    // 많이 걷기 피하는 경우 이동거리 보너스 강화
    if (prefs.avoidConditions.includes('많이 걷기') && travelTime > 20) {
      score -= 15;
    }
  }

  // 7. 실내/야외 보너스
  if (prefs.avoidConditions.includes('야외') && place.indoor) {
    score += 5;
  }

  // 8. 주차 보너스 (자동차 이동수단)
  if (prefs.transport === 'car' && place.parking) {
    score += 10;
    reasons.push('주차가 가능한 장소예요.');
  } else if (prefs.transport === 'car' && !place.parking) {
    score -= 10;
  }

  // 9. 카테고리 다양성 (같은 카테고리 반복 감점)
  if (context.usedCategories.includes(place.category)) {
    score -= 20;
  }

  // 10. 분위기 매칭 보너스
  if (prefs.companion === 'parent' && place.moodTags.includes('부모님과 가기 좋은')) {
    score += 10;
  }
  if (prefs.companion === 'couple' && place.moodTags.includes('로맨틱한')) {
    score += 10;
  }

  return { place, score, reasons };
}

interface ScoringContext {
  currentTotalCost: number;
  lastPlace: Place | null;
  usedCategories: PlaceCategory[];
  currentTime: string;
  dayOfWeek: number;
}

// ===== 코스 생성 =====

/** 메인 코스 생성 함수 */
export function generateCourse(prefs: UserPreferences): RecommendationResult {
  // 1. 시간 계산
  const startTime = prefs.startTime === 'now' ? getCurrentTime() : prefs.startTime;
  const endTime = prefs.endTime || addMinutes(startTime, 180); // 기본 3시간
  const availableMinutes = getAvailableMinutes(startTime, endTime);
  const dayOfWeek = getCurrentDayOfWeek();

  // 2. 후보 장소 필터링
  const cityInfo = locationPresetMap[prefs.location];
  const city = cityInfo?.city || 'ulsan';
  let candidatePlaces = getPlacesByCity(city);

  // 지역 필터링 (custom이 아닌 경우 해당 동네 장소 우선)
  if (prefs.location !== 'custom' && cityInfo) {
    const localPlaces = candidatePlaces.filter((p) =>
      cityInfo.neighborhoods.includes(p.neighborhood)
    );
    // 해당 지역에 장소가 충분하면 그 지역만, 아니면 전체 도시 사용
    if (localPlaces.length >= 10) {
      candidatePlaces = localPlaces;
    }
  }

  // 3. 필수 조건 필터링
  candidatePlaces = candidatePlaces.filter((place) => {
    // 휴무일 체크
    if (place.closedDays.includes(dayOfWeek)) return false;

    // 인원수 체크
    if (prefs.groupSize < place.groupSizeMin || prefs.groupSize > place.groupSizeMax) {
      return false;
    }

    // 피하고 싶은 조건 체크
    for (const avoid of prefs.avoidConditions) {
      const filter = AVOID_FILTERS[avoid];
      if (filter && filter(place)) return false;
    }

    return true;
  });

  if (candidatePlaces.length === 0) {
    return createNoPlacesError(prefs);
  }

  // 4. 코스 슬롯 결정
  const slots = determineCourseSlots(prefs, availableMinutes);

  // 5. 슬롯별 장소 선택
  const courseStops = buildCourse(candidatePlaces, slots, prefs, startTime, dayOfWeek);

  if (courseStops.length === 0) {
    return createNoPlacesError(prefs);
  }

  // 6. 코스 객체 생성
  const course = assembleCourse(courseStops, prefs);
  return { success: true, course };
}

/** 코스에 필요한 슬롯(카테고리) 결정 */
function determineCourseSlots(prefs: UserPreferences, availableMinutes: number): PlaceCategory[] {
  const slots: PlaceCategory[] = [];

  // 원하는 활동 기반으로 슬롯 결정
  if (prefs.desiredActivities.length > 0 && !prefs.desiredActivities.includes('랜덤')) {
    for (const activity of prefs.desiredActivities) {
      const categories = ACTIVITY_TO_CATEGORY[activity];
      if (categories.length > 0) {
        slots.push(categories[0]);
      }
    }

    // 식사가 포함되지 않았으면 시간대에 따라 추가
    const startMinutes = timeToMinutes(prefs.startTime === 'now' ? getCurrentTime() : prefs.startTime);
    const hasMeal = slots.includes('restaurant');
    if (!hasMeal) {
      // 점심(11~14시) 또는 저녁(17~20시) 시간대에 시작하면 식사 추가
      if ((startMinutes >= 660 && startMinutes <= 840) || (startMinutes >= 1020 && startMinutes <= 1200)) {
        slots.unshift('restaurant');
      }
    }

    // 시간이 남으면 카페 추가
    const estimatedDuration = slots.length * 60; // 대략 장소당 60분
    if (estimatedDuration < availableMinutes - 40 && !slots.includes('cafe')) {
      slots.push('cafe');
    }
  } else {
    // 랜덤 또는 활동 미선택: 패턴 기반
    const pattern = selectFlowPattern(prefs, availableMinutes);
    slots.push(...pattern);
  }

  // 시간에 맞게 슬롯 수 조정 (장소당 최소 30분 + 이동시간 15분)
  const maxSlots = Math.floor(availableMinutes / 45);
  return slots.slice(0, Math.min(slots.length, maxSlots, 6));
}

/** 코스 흐름 패턴 선택 */
function selectFlowPattern(prefs: UserPreferences, availableMinutes: number): PlaceCategory[] {
  // 시간이 짧으면 2-3곳, 길면 4-5곳
  const targetCount = availableMinutes <= 120 ? 2 : availableMinutes <= 240 ? 3 : 4;

  // 동행자에 따른 패턴 선호
  let patterns = COURSE_FLOW_PATTERNS;

  if (prefs.companion === 'parent') {
    patterns = patterns.filter(
      (p) => !p.includes('karaoke') && !p.includes('escape_room')
    );
  }

  // 랜덤 선택
  const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
  return selectedPattern.slice(0, targetCount);
}

/** 슬롯에 맞는 장소를 선택하여 코스 구성 */
function buildCourse(
  candidates: Place[],
  slots: PlaceCategory[],
  prefs: UserPreferences,
  startTime: string,
  dayOfWeek: number
): CourseStop[] {
  const stops: CourseStop[] = [];
  let currentTime = startTime;
  let currentTotalCost = 0;
  let lastPlace: Place | null = null;
  const usedPlaceIds: Set<string> = new Set();
  const usedCategories: PlaceCategory[] = [];

  for (let i = 0; i < slots.length; i++) {
    const targetCategory = slots[i];

    // 해당 카테고리 후보
    let slotCandidates = candidates.filter(
      (p) => p.category === targetCategory && !usedPlaceIds.has(p.id)
    );

    // 카테고리에 맞는 장소가 없으면 유사 카테고리에서 검색
    if (slotCandidates.length === 0) {
      slotCandidates = candidates.filter(
        (p) => !usedPlaceIds.has(p.id) && !usedCategories.includes(p.category)
      );
    }

    if (slotCandidates.length === 0) continue;

    // 영업시간 필터
    slotCandidates = slotCandidates.filter((p) =>
      canVisitDuring(p.openingHours, dayOfWeek, currentTime, p.averageDuration)
    );

    if (slotCandidates.length === 0) continue;

    // 점수 계산
    const context: ScoringContext = {
      currentTotalCost,
      lastPlace,
      usedCategories,
      currentTime,
      dayOfWeek,
    };

    const scored = slotCandidates
      .map((p) => scorePlace(p, prefs, context))
      .filter((s) => s.score > -100)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) continue;

    // 상위 3개 중 랜덤 선택 (약간의 변동성)
    const topN = scored.slice(0, Math.min(3, scored.length));
    const selected = topN[Math.floor(Math.random() * topN.length)];
    const place = selected.place;

    // 이동 시간 계산
    let travelTime = 0;
    let distance = 0;
    if (lastPlace) {
      distance = calculateDistance(
        lastPlace.latitude,
        lastPlace.longitude,
        place.latitude,
        place.longitude
      );
      travelTime = estimateTravelTime(distance, prefs.transport);
    }

    // 이동 시간 반영
    const arrivalTime = addMinutes(currentTime, travelTime);

    // 코스 정지점 생성
    const stop: CourseStop = {
      id: `stop-${i}-${place.id}`,
      place,
      startTime: arrivalTime,
      endTime: addMinutes(arrivalTime, place.averageDuration),
      duration: place.averageDuration,
      estimatedCost: place.averageCost,
      distanceFromPrev: Math.round(distance),
      travelTimeFromPrev: travelTime,
      recommendReason: selected.reasons[0] || generateReason(place, prefs),
      order: i,
    };

    stops.push(stop);
    currentTime = stop.endTime;
    currentTotalCost += place.averageCost;
    lastPlace = place;
    usedPlaceIds.add(place.id);
    usedCategories.push(place.category);

    // 종료 시간 체크
    const endTime = prefs.endTime || addMinutes(startTime, 180);
    if (timeToMinutes(currentTime) >= timeToMinutes(endTime)) break;
  }

  return stops;
}

/** 코스 객체 조립 */
function assembleCourse(stops: CourseStop[], prefs: UserPreferences): Course {
  const totalCost = stops.reduce((sum, s) => sum + s.estimatedCost, 0);
  const totalTravel = stops.reduce((sum, s) => sum + s.travelTimeFromPrev, 0);
  const totalDuration =
    stops.length > 0
      ? timeToMinutes(stops[stops.length - 1].endTime) - timeToMinutes(stops[0].startTime)
      : 0;
  const indoorCount = stops.filter((s) => s.place.indoor).length;
  const indoorRatio = stops.length > 0 ? indoorCount / stops.length : 0;

  return {
    id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stops,
    totalCostPerPerson: totalCost,
    totalTravelTime: totalTravel,
    totalDuration,
    indoorRatio,
    preferences: prefs,
    createdAt: new Date().toISOString(),
  };
}

// ===== 추천 이유 생성 =====

function getCompanionReason(companion: string, place: Place): string {
  const reasons: Record<string, string> = {
    friend: `친구 ${place.groupSizeMax > 4 ? '여러 명이' : '와'} 함께 즐길 수 있는 곳이에요.`,
    couple: '연인과 함께하기 좋은 분위기의 장소예요.',
    parent: '부모님과 편하게 방문할 수 있는 곳이에요.',
    coworker: '직장동료와 함께 즐기기 좋은 장소예요.',
    solo: '혼자서도 편하게 즐길 수 있는 곳이에요.',
  };
  return reasons[companion] || '조건에 적합한 장소예요.';
}

function generateReason(place: Place, prefs: UserPreferences): string {
  const reasons: string[] = [];

  if (place.averageCost === 0) {
    reasons.push('무료로 즐길 수 있어요.');
  } else if (prefs.budgetPerPerson && place.averageCost <= prefs.budgetPerPerson * 0.3) {
    reasons.push('가격이 부담스럽지 않은 곳이에요.');
  }

  if (place.indoor && prefs.avoidConditions.includes('야외')) {
    reasons.push('실내에서 편하게 즐길 수 있어요.');
  }

  if (place.parking && prefs.transport === 'car') {
    reasons.push('주차가 가능해서 편하게 방문할 수 있어요.');
  }

  if (place.moodTags.includes('활동적인')) {
    reasons.push('에너지 넘치는 활동을 즐길 수 있어요.');
  }

  if (place.moodTags.includes('사진 찍기 좋은')) {
    reasons.push('사진 찍기 좋은 분위기예요.');
  }

  return reasons[0] || '오늘 코스에 잘 어울리는 장소예요.';
}

// ===== 에러 처리 =====

function createNoPlacesError(prefs: UserPreferences): RecommendationResult {
  const error: RecommendationError = {
    type: 'no_places',
    message: '현재 조건을 모두 충족하는 코스를 만들 수 없어요.',
    suggestions: [
      {
        label: '예산 1만 원 늘리기',
        action: () => ({
          ...prefs,
          budgetPerPerson: (prefs.budgetPerPerson || 30000) + 10000,
        }),
      },
      {
        label: '피하고 싶은 조건 줄이기',
        action: () => ({
          ...prefs,
          avoidConditions: prefs.avoidConditions.slice(0, 1),
        }),
      },
      {
        label: '종료시간 1시간 늦추기',
        action: () => ({
          ...prefs,
          endTime: prefs.endTime ? addMinutes(prefs.endTime, 60) : undefined,
        }),
      },
      {
        label: '다른 지역에서 찾기',
        action: () => ({
          ...prefs,
          location: 'custom' as const,
        }),
      },
    ],
  };

  return { success: false, error };
}

// ===== 코스 수정 =====

/** 특정 장소만 교체하여 코스 수정 */
export function modifyCourse(
  course: Course,
  stopIdToReplace: string,
  targetCategory?: PlaceCategory
): RecommendationResult {
  const stopIndex = course.stops.findIndex((s) => s.id === stopIdToReplace);
  if (stopIndex === -1) return { success: true, course };

  const prefs = course.preferences;
  const dayOfWeek = getCurrentDayOfWeek();

  // 후보 장소
  const cityInfo = locationPresetMap[prefs.location];
  const city = cityInfo?.city || 'ulsan';
  let candidates = getPlacesByCity(city);

  // 이미 코스에 있는 장소 제외
  const usedIds = new Set(course.stops.map((s) => s.place.id));
  candidates = candidates.filter((p) => !usedIds.has(p.id));

  // 카테고리 필터
  if (targetCategory) {
    candidates = candidates.filter((p) => p.category === targetCategory);
  } else {
    // 같은 카테고리로 교체
    const originalCategory = course.stops[stopIndex].place.category;
    candidates = candidates.filter((p) => p.category === originalCategory);
  }

  // 필수 조건 필터
  candidates = candidates.filter((place) => {
    if (place.closedDays.includes(dayOfWeek)) return false;
    if (prefs.groupSize < place.groupSizeMin || prefs.groupSize > place.groupSizeMax) return false;
    for (const avoid of prefs.avoidConditions) {
      const filter = AVOID_FILTERS[avoid];
      if (filter && filter(place)) return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    return createNoPlacesError(prefs);
  }

  // 이전 장소 기준 점수 계산
  const prevPlace = stopIndex > 0 ? course.stops[stopIndex - 1].place : null;
  const currentTotalCost = course.stops
    .filter((_, i) => i !== stopIndex)
    .reduce((sum, s) => sum + s.estimatedCost, 0);

  const context: ScoringContext = {
    currentTotalCost,
    lastPlace: prevPlace,
    usedCategories: course.stops.filter((_, i) => i !== stopIndex).map((s) => s.place.category),
    currentTime: course.stops[stopIndex].startTime,
    dayOfWeek,
  };

  const scored = candidates
    .map((p) => scorePlace(p, prefs, context))
    .filter((s) => s.score > -100)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return createNoPlacesError(prefs);
  }

  const selected = scored[0];
  const newPlace = selected.place;

  // 새 장소로 교체
  const newStops = [...course.stops];
  const oldStop = newStops[stopIndex];

  let distance = 0;
  let travelTime = 0;
  if (prevPlace) {
    distance = calculateDistance(
      prevPlace.latitude,
      prevPlace.longitude,
      newPlace.latitude,
      newPlace.longitude
    );
    travelTime = estimateTravelTime(distance, prefs.transport);
  }

  newStops[stopIndex] = {
    ...oldStop,
    place: newPlace,
    duration: newPlace.averageDuration,
    estimatedCost: newPlace.averageCost,
    distanceFromPrev: Math.round(distance),
    travelTimeFromPrev: travelTime,
    endTime: addMinutes(oldStop.startTime, newPlace.averageDuration),
    recommendReason: selected.reasons[0] || generateReason(newPlace, prefs),
  };

  // 후속 장소들의 시간 재계산
  for (let i = stopIndex + 1; i < newStops.length; i++) {
    const prevStop = newStops[i - 1];
    const dist = calculateDistance(
      prevStop.place.latitude,
      prevStop.place.longitude,
      newStops[i].place.latitude,
      newStops[i].place.longitude
    );
    const travel = estimateTravelTime(dist, prefs.transport);
    const newStart = addMinutes(prevStop.endTime, travel);

    newStops[i] = {
      ...newStops[i],
      startTime: newStart,
      endTime: addMinutes(newStart, newStops[i].duration),
      distanceFromPrev: Math.round(dist),
      travelTimeFromPrev: travel,
    };
  }

  // 새 코스 조립
  const newCourse = assembleCourse(newStops, prefs);
  newCourse.id = course.id; // ID 유지

  return { success: true, course: newCourse };
}

/** 예산 줄이기 수정 */
export function reduceBudgetCourse(course: Course): RecommendationResult {
  // 가장 비싼 장소를 더 저렴한 것으로 교체
  const sortedByExpense = [...course.stops].sort(
    (a, b) => b.estimatedCost - a.estimatedCost
  );
  const mostExpensive = sortedByExpense[0];

  return modifyCourse(course, mostExpensive.id);
}

/** 이동거리 줄이기 수정 */
export function reduceDistanceCourse(course: Course): RecommendationResult {
  // 이동거리가 가장 긴 장소를 교체
  const sortedByDistance = [...course.stops]
    .filter((s) => s.order > 0)
    .sort((a, b) => b.distanceFromPrev - a.distanceFromPrev);

  if (sortedByDistance.length === 0) {
    return { success: true, course };
  }

  return modifyCourse(course, sortedByDistance[0].id);
}

/** 실내 전용 코스로 수정 */
export function makeIndoorCourse(course: Course): RecommendationResult {
  const outdoorStops = course.stops.filter((s) => !s.place.indoor);
  let currentCourse = course;

  for (const stop of outdoorStops) {
    const result = modifyCourse(currentCourse, stop.id);
    if (result.success && result.course) {
      currentCourse = result.course;
    }
  }

  return { success: true, course: currentCourse };
}

/** 특정 카테고리 제거 */
export function removeCategoryFromCourse(
  course: Course,
  category: PlaceCategory
): RecommendationResult {
  const newStops = course.stops.filter((s) => s.place.category !== category);

  if (newStops.length === 0) {
    return createNoPlacesError(course.preferences);
  }

  const newCourse = assembleCourse(newStops, course.preferences);
  newCourse.id = course.id;
  return { success: true, course: newCourse };
}

/** 전체 코스 재생성 */
export function regenerateCourse(prefs: UserPreferences): RecommendationResult {
  return generateCourse(prefs);
}

// ===== 비동기 코스 생성 (카카오 API 기반) =====

/**
 * 카카오 API로 실제 장소를 검색하여 코스를 생성합니다.
 * API 키가 없으면 기존 샘플 데이터 기반으로 폴백합니다.
 */
export async function generateCourseAsync(prefs: UserPreferences): Promise<RecommendationResult> {
  // 카카오 API 키가 없으면 기존 동기 방식으로 폴백
  if (!isKakaoSearchReady()) {
    return generateCourse(prefs);
  }

  try {
    // 1. 시간 계산
    const startTime = prefs.startTime === 'now' ? getCurrentTime() : prefs.startTime;
    const endTime = prefs.endTime || addMinutes(startTime, 180);
    const availableMinutes = getAvailableMinutes(startTime, endTime);

    // 2. 코스 슬롯(카테고리) 결정
    const slots = determineCourseSlots(prefs, availableMinutes);
    const uniqueCategories = [...new Set(slots)];

    // 3. 카카오 API로 실제 장소 검색 (카테고리별 병렬)
    const placesByCategory = await searchRealPlacesByCategories(
      uniqueCategories,
      prefs.location,
      8
    );

    // 4. 검색 결과를 평탄화하여 후보 목록 구성
    let candidatePlaces: Place[] = [];
    for (const [, places] of placesByCategory) {
      candidatePlaces.push(...places);
    }

    // 4-1. 출발지 좌표가 있으면 가까운 순으로 정렬
    if (prefs.startCoords) {
      const { latitude: sLat, longitude: sLng } = prefs.startCoords;
      candidatePlaces.sort((a, b) => {
        const distA = calculateDistance(sLat, sLng, a.latitude, a.longitude);
        const distB = calculateDistance(sLat, sLng, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    // 4-2. 꼭 가고 싶은 장소가 있으면 후보에 강제 삽입
    const mustVisitPlaces = prefs.mustVisitPlaces || [];
    const mustVisitAsPlaces: Place[] = [];
    if (mustVisitPlaces.length > 0) {
      for (const mv of mustVisitPlaces) {
        // 이미 후보에 있는지 확인
        const existing = candidatePlaces.find(
          (p) => p.name === mv.name || p.id === `kakao-${mv.kakaoId}`
        );
        if (existing) {
          mustVisitAsPlaces.push(existing);
        } else if (mv.latitude && mv.longitude) {
          // 없으면 Place 객체 생성
          const mvPlace: Place = {
            id: `must-visit-${mv.kakaoId || mv.name}`,
            name: mv.name,
            city: 'ulsan',
            district: '',
            neighborhood: '',
            address: '',
            latitude: mv.latitude,
            longitude: mv.longitude,
            category: 'restaurant', // 기본값, 실제로는 카카오 카테고리로 매핑해야 함
            description: mv.name,
            suitableFor: ['friend', 'couple', 'solo', 'parent', 'coworker'],
            moodTags: [],
            activityTags: [],
            indoor: true,
            parking: false,
            groupSizeMin: 1,
            groupSizeMax: 10,
            averageCost: 10000,
            averageDuration: 60,
            openingHours: {
              mon: { open: '10:00', close: '22:00' },
              tue: { open: '10:00', close: '22:00' },
              wed: { open: '10:00', close: '22:00' },
              thu: { open: '10:00', close: '22:00' },
              fri: { open: '10:00', close: '23:00' },
              sat: { open: '10:00', close: '23:00' },
              sun: { open: '10:00', close: '21:00' },
            },
            closedDays: [],
            reservationRequired: false,
            mapUrl: mv.placeUrl || 'https://map.kakao.com/',
            featured: false,
            verified: true,
            lastUpdated: new Date().toISOString().split('T')[0],
            isSample: false,
            externalData: {
              kakaoPlace: mv.kakaoId ? {
                kakaoId: mv.kakaoId,
                placeName: mv.name,
                addressName: '',
                categoryName: '',
                placeUrl: mv.placeUrl || '',
                latitude: mv.latitude,
                longitude: mv.longitude,
              } : undefined,
              fetchedAt: new Date().toISOString(),
            },
          };
          mustVisitAsPlaces.push(mvPlace);
          candidatePlaces.push(mvPlace);
        }
      }
    }

    // 검색 결과가 부족하면 샘플 데이터로 폴백
    if (candidatePlaces.length < 3) {
      console.warn('[RecommendationEngine] 카카오 검색 결과 부족, 샘플 데이터 병합');
      const cityInfo = locationPresetMap[prefs.location];
      const city = cityInfo?.city || 'ulsan';
      const samplePlaces = getPlacesByCity(city);
      candidatePlaces = [...candidatePlaces, ...samplePlaces];
    }

    // 5. 피하고 싶은 조건 필터 (must-visit 장소는 필터 안함)
    const mustVisitIds = new Set(mustVisitAsPlaces.map((p) => p.id));
    candidatePlaces = candidatePlaces.filter((place) => {
      if (mustVisitIds.has(place.id)) return true; // must-visit은 유지
      for (const avoid of prefs.avoidConditions) {
        const filter = AVOID_FILTERS[avoid];
        if (filter && filter(place)) return false;
      }
      return true;
    });

    if (candidatePlaces.length === 0) {
      return createNoPlacesError(prefs);
    }

    // 6. 슬롯별 장소 선택
    // must-visit 장소를 코스에 강제 포함시키기 위해 buildCourse 전에 처리
    const dayOfWeek = getCurrentDayOfWeek();
    let courseStops: CourseStop[];

    if (mustVisitAsPlaces.length > 0) {
      // must-visit 장소를 먼저 배치하고 나머지를 채우는 방식
      courseStops = buildCourseWithMustVisit(
        candidatePlaces,
        mustVisitAsPlaces,
        slots,
        prefs,
        startTime,
        dayOfWeek
      );
    } else {
      courseStops = buildCourse(candidatePlaces, slots, prefs, startTime, dayOfWeek);
    }

    if (courseStops.length === 0) {
      return createNoPlacesError(prefs);
    }

    // 7. 코스 객체 생성
    const course = assembleCourse(courseStops, prefs);
    return { success: true, course };
  } catch (error) {
    console.error('[RecommendationEngine] 비동기 코스 생성 실패, 폴백:', error);
    // 실패 시 기존 방식으로 폴백
    return generateCourse(prefs);
  }
}

/** must-visit 장소를 포함하여 코스를 구성 */
function buildCourseWithMustVisit(
  candidates: Place[],
  mustVisitPlaces: Place[],
  slots: PlaceCategory[],
  prefs: UserPreferences,
  startTime: string,
  dayOfWeek: number
): CourseStop[] {
  const stops: CourseStop[] = [];
  let currentTime = startTime;
  let currentTotalCost = 0;
  let lastPlace: Place | null = null;
  const usedPlaceIds: Set<string> = new Set();
  const usedCategories: PlaceCategory[] = [];

  // must-visit 장소를 슬롯 중간에 배치
  // 전략: 슬롯 수에 맞춰 must-visit을 균등 분배
  const totalSlots = slots.length;
  const mvIndexes: number[] = [];
  if (mustVisitPlaces.length === 1) {
    mvIndexes.push(Math.min(1, totalSlots - 1)); // 두 번째 위치
  } else {
    // 균등 분배
    for (let i = 0; i < mustVisitPlaces.length; i++) {
      const pos = Math.round(((i + 1) / (mustVisitPlaces.length + 1)) * totalSlots);
      mvIndexes.push(Math.min(pos, totalSlots - 1));
    }
  }

  let mvUsed = 0;

  for (let i = 0; i < totalSlots; i++) {
    let place: Place | null = null;
    let reason = '';

    // 이 슬롯에 must-visit을 배치할 차례인지 확인
    if (mvUsed < mustVisitPlaces.length && mvIndexes[mvUsed] === i) {
      place = mustVisitPlaces[mvUsed];
      reason = `⭐ 꼭 가고 싶어 하신 "${place.name}" 이에요!`;
      mvUsed++;
    } else {
      // 일반 장소 선택 (기존 로직)
      const targetCategory = slots[i];
      let slotCandidates = candidates.filter(
        (p) => p.category === targetCategory && !usedPlaceIds.has(p.id)
      );

      if (slotCandidates.length === 0) {
        slotCandidates = candidates.filter(
          (p) => !usedPlaceIds.has(p.id) && !usedCategories.includes(p.category)
        );
      }

      if (slotCandidates.length === 0) continue;

      // 영업시간 필터
      slotCandidates = slotCandidates.filter((p) =>
        canVisitDuring(p.openingHours, dayOfWeek, currentTime, p.averageDuration)
      );

      if (slotCandidates.length === 0) continue;

      // 점수 계산
      const context: ScoringContext = {
        currentTotalCost,
        lastPlace,
        usedCategories,
        currentTime,
        dayOfWeek,
      };

      const scored = slotCandidates
        .map((p) => scorePlace(p, prefs, context))
        .filter((s) => s.score > -100)
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) continue;

      const topN = scored.slice(0, Math.min(3, scored.length));
      const selected = topN[Math.floor(Math.random() * topN.length)];
      place = selected.place;
      reason = selected.reasons[0] || generateReason(place, prefs);
    }

    if (!place) continue;

    // 이동 시간 계산
    let travelTime = 0;
    let distance = 0;
    if (lastPlace) {
      distance = calculateDistance(
        lastPlace.latitude, lastPlace.longitude,
        place.latitude, place.longitude
      );
      travelTime = estimateTravelTime(distance, prefs.transport);
    } else if (prefs.startCoords) {
      // 첫 장소: 출발지로부터의 이동시간
      distance = calculateDistance(
        prefs.startCoords.latitude, prefs.startCoords.longitude,
        place.latitude, place.longitude
      );
      travelTime = estimateTravelTime(distance, prefs.transport);
    }

    const arrivalTime = addMinutes(currentTime, travelTime);

    const stop: CourseStop = {
      id: `stop-${i}-${place.id}`,
      place,
      startTime: arrivalTime,
      endTime: addMinutes(arrivalTime, place.averageDuration),
      duration: place.averageDuration,
      estimatedCost: place.averageCost,
      distanceFromPrev: Math.round(distance),
      travelTimeFromPrev: travelTime,
      recommendReason: reason,
      order: i,
    };

    stops.push(stop);
    currentTime = stop.endTime;
    currentTotalCost += place.averageCost;
    lastPlace = place;
    usedPlaceIds.add(place.id);
    usedCategories.push(place.category);

    // 종료 시간 체크
    const endTimeLimit = prefs.endTime || addMinutes(startTime, 180);
    if (timeToMinutes(currentTime) >= timeToMinutes(endTimeLimit)) break;
  }

  return stops;
}
