/**
 * 추천 엔진 (백엔드)
 *
 * 카카오 API를 호출해서 실제 장소를 검색하고,
 * 점수 기반으로 코스를 생성합니다.
 */

import { searchPlacesByCategory } from './kakao-api';
import { CourseRequest, CourseResponse, PlaceResult, CourseStop } from '../types';

/** 카테고리별 검색 키워드 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  restaurant: ['맛집', '음식점'],
  cafe: ['카페', '디저트카페'],
  bowling: ['볼링장'],
  escape_room: ['방탈출'],
  board_game: ['보드게임카페'],
  karaoke: ['노래방', '코인노래방'],
  photo_studio: ['셀프사진관', '인생네컷'],
  bar: ['술집', '이자카야'],
  craft_workshop: ['공방', '원데이클래스'],
  exhibition: ['전시회', '갤러리'],
  park: ['공원'],
  shopping: ['쇼핑몰'],
};

/** 카테고리별 기본 체류 시간 */
const CATEGORY_DURATION: Record<string, number> = {
  restaurant: 60,
  cafe: 50,
  bowling: 60,
  escape_room: 70,
  board_game: 60,
  karaoke: 60,
  photo_studio: 30,
  bar: 60,
  craft_workshop: 90,
  exhibition: 60,
  park: 40,
  shopping: 60,
};

/** 카테고리별 평균 비용 */
const CATEGORY_COST: Record<string, number> = {
  restaurant: 12000,
  cafe: 6000,
  bowling: 15000,
  escape_room: 20000,
  board_game: 10000,
  karaoke: 8000,
  photo_studio: 5000,
  bar: 15000,
  craft_workshop: 25000,
  exhibition: 10000,
  park: 0,
  shopping: 20000,
};

/** 지역 프리셋 좌표 */
const REGION_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  ulsan_univ: { lat: 35.5425, lng: 129.2564, name: '울산 남구 무거동' },
  samsan: { lat: 35.5387, lng: 129.3365, name: '울산 남구 삼산동' },
  seongnam: { lat: 35.5544, lng: 129.3156, name: '울산 중구 성남동' },
  ilsan_daewangam: { lat: 35.5836, lng: 129.4355, name: '울산 동구 일산동' },
  ulju: { lat: 35.5209, lng: 129.1830, name: '울산 울주군' },
  custom: { lat: 35.5384, lng: 129.3114, name: '울산' },
};

/** 두 좌표간 거리 (미터) */
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 이동 시간 추정 (분) */
function estimateTravel(distance: number, transport: string): number {
  const speed = transport === 'car' ? 30 : transport === 'walk' ? 4 : 15; // km/h
  return Math.round((distance / 1000 / speed) * 60);
}

/** 시간 문자열 "HH:mm"에 분 더하기 */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/** 코스 슬롯 결정 */
function determineSlotsFromActivities(activities: string[], availableMinutes: number): string[] {
  const activityToCategory: Record<string, string[]> = {
    '먹기': ['restaurant'],
    '카페': ['cafe'],
    '활동적인 체험': ['bowling', 'escape_room', 'board_game', 'karaoke'],
    '소품샵': ['shopping'],
    '사진': ['photo_studio'],
    '산책': ['park'],
    '문화생활': ['exhibition', 'craft_workshop'],
    '술': ['bar'],
  };

  const slots: string[] = [];

  if (activities.length > 0 && !activities.includes('랜덤')) {
    for (const act of activities) {
      const cats = activityToCategory[act];
      if (cats && cats.length > 0) slots.push(cats[0]);
    }
    if (!slots.includes('restaurant')) {
      const now = new Date();
      const hour = now.getHours();
      if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 20)) {
        slots.unshift('restaurant');
      }
    }
    if (!slots.includes('cafe')) slots.push('cafe');
  } else {
    // 랜덤 패턴
    const patterns = [
      ['restaurant', 'cafe', 'bowling'],
      ['restaurant', 'karaoke', 'cafe'],
      ['cafe', 'restaurant', 'photo_studio'],
      ['restaurant', 'board_game', 'cafe'],
    ];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    slots.push(...pattern);
  }

  const maxSlots = Math.floor(availableMinutes / 45);
  return slots.slice(0, Math.min(slots.length, maxSlots, 5));
}

/**
 * 메인 코스 생성 함수
 */
export async function generateCourse(request: CourseRequest): Promise<CourseResponse> {
  const {
    location,
    startTime: rawStartTime,
    endTime: rawEndTime,
    desiredActivities,
    transport,
    startCoords,
    mustVisitPlaces,
  } = request;

  // 1. 기준 좌표 결정
  const region = REGION_COORDS[location] || REGION_COORDS['custom'];
  const baseLat = startCoords?.latitude || region.lat;
  const baseLng = startCoords?.longitude || region.lng;

  // 2. 시간 계산
  const now = new Date();
  const startTime = rawStartTime === 'now'
    ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    : rawStartTime;
  const endTime = rawEndTime || addMinutes(startTime, 180);
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const availableMinutes = (eH * 60 + eM) - (sH * 60 + sM);

  // 3. 코스 슬롯 결정
  const slots = determineSlotsFromActivities(desiredActivities || [], availableMinutes);

  // 4. 카테고리별 장소 검색 (병렬)
  const uniqueCategories = [...new Set(slots)];
  const searchResults = await Promise.all(
    uniqueCategories.map(async (category) => {
      const keywords = CATEGORY_KEYWORDS[category] || [category];
      const keyword = `${region.name} ${keywords[0]}`;
      const docs = await searchPlacesByCategory(keyword, baseLat, baseLng, 5000, 8);
      return { category, docs };
    })
  );

  // 5. 카테고리별로 후보 구성
  const candidatesByCategory = new Map<string, PlaceResult[]>();
  for (const { category, docs } of searchResults) {
    candidatesByCategory.set(category, docs.map((doc) => ({
      id: doc.id,
      name: doc.place_name,
      address: doc.road_address_name || doc.address_name,
      category,
      subCategory: doc.category_name.split(' > ').slice(2).join(' ') || undefined,
      latitude: parseFloat(doc.y),
      longitude: parseFloat(doc.x),
      phone: doc.phone || undefined,
      placeUrl: doc.place_url,
      averageCost: CATEGORY_COST[category] || 10000,
      averageDuration: CATEGORY_DURATION[category] || 60,
    })));
  }

  // 6. 코스 구성
  const stops: CourseStop[] = [];
  let currentTime = startTime;
  let lastLat = baseLat;
  let lastLng = baseLng;
  const usedIds = new Set<string>();

  // must-visit 장소 인덱스 배치
  const mvPlaces = mustVisitPlaces || [];
  const mvIndexes: number[] = [];
  if (mvPlaces.length === 1) {
    mvIndexes.push(Math.min(1, slots.length - 1));
  } else {
    for (let i = 0; i < mvPlaces.length; i++) {
      mvIndexes.push(Math.round(((i + 1) / (mvPlaces.length + 1)) * slots.length));
    }
  }
  let mvUsed = 0;

  for (let i = 0; i < slots.length; i++) {
    let place: PlaceResult | null = null;
    let reason = '';

    // must-visit 배치 차례인지 확인
    if (mvUsed < mvPlaces.length && mvIndexes[mvUsed] === i) {
      const mv = mvPlaces[mvUsed];
      place = {
        id: mv.kakaoId || `must-${i}`,
        name: mv.name,
        address: '',
        category: slots[i],
        latitude: mv.latitude || baseLat,
        longitude: mv.longitude || baseLng,
        placeUrl: mv.placeUrl || '',
        averageCost: CATEGORY_COST[slots[i]] || 10000,
        averageDuration: CATEGORY_DURATION[slots[i]] || 60,
      };
      reason = `⭐ 꼭 가고 싶어 하신 "${mv.name}" 이에요!`;
      mvUsed++;
    } else {
      // 일반 장소 선택 (가까운 순 + 미사용)
      const candidates = candidatesByCategory.get(slots[i]) || [];
      const available = candidates.filter((p) => !usedIds.has(p.id));

      if (available.length > 0) {
        // 가까운 순 정렬 후 상위 3개 중 랜덤
        available.sort((a, b) => {
          const distA = calcDistance(lastLat, lastLng, a.latitude, a.longitude);
          const distB = calcDistance(lastLat, lastLng, b.latitude, b.longitude);
          return distA - distB;
        });
        const topN = available.slice(0, 3);
        place = topN[Math.floor(Math.random() * topN.length)];
        reason = '오늘 코스에 잘 어울리는 장소예요.';
      }
    }

    if (!place) continue;

    // 이동 시간 계산
    const distance = calcDistance(lastLat, lastLng, place.latitude, place.longitude);
    const travelTime = estimateTravel(distance, transport || 'any');
    const arrivalTime = addMinutes(currentTime, travelTime);

    stops.push({
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
    });

    currentTime = addMinutes(arrivalTime, place.averageDuration);
    lastLat = place.latitude;
    lastLng = place.longitude;
    usedIds.add(place.id);

    // 종료 시간 체크
    const [cH, cM] = currentTime.split(':').map(Number);
    if (cH * 60 + cM >= eH * 60 + eM) break;
  }

  if (stops.length === 0) {
    return { success: false, error: '조건에 맞는 장소를 찾지 못했어요.' };
  }

  const totalCost = stops.reduce((sum, s) => sum + s.estimatedCost, 0);
  const totalTravel = stops.reduce((sum, s) => sum + s.travelTimeFromPrev, 0);

  return {
    success: true,
    course: {
      id: `course-${Date.now()}`,
      stops,
      totalCostPerPerson: totalCost,
      totalTravelTime: totalTravel,
      createdAt: new Date().toISOString(),
    },
  };
}
