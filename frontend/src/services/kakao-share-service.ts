import { Course } from '../types';
import { formatCost } from '../utils/cost';

/**
 * 카카오톡 공유 서비스
 *
 * 카카오 JavaScript SDK를 사용하여 코스를 카카오톡으로 공유합니다.
 * SDK는 index.html에서 로드됩니다.
 */

declare global {
  interface Window {
    Kakao: any;
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || 'c905039d1bac758e8d6d0b4d46321d6';

let initialized = false;

/** 카카오 SDK 초기화 */
function initKakaoSDK() {
  if (initialized) return true;
  if (!window.Kakao) {
    console.warn('[KakaoShare] SDK가 로드되지 않았습니다.');
    return false;
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_JS_KEY);
  }
  initialized = true;
  return true;
}

/**
 * 코스를 카카오톡으로 공유합니다.
 * 리스트 템플릿으로 장소 목록을 보여줍니다.
 */
export function shareCourseToKakao(course: Course): boolean {
  if (!initKakaoSDK()) return false;

  const stops = course.stops;
  const totalCost = formatCost(course.totalCostPerPerson);
  const stopNames = stops.map((s) => s.place.name).join(' → ');

  // 코스 요약 텍스트
  const description = `${stops.length}곳 | ${totalCost} | ${stops[0]?.startTime}~${stops[stops.length - 1]?.endTime}`;

  // 장소별 리스트 아이템 (최대 3개)
  const items = stops.slice(0, 3).map((stop) => ({
    item: stop.place.name,
    itemOp: `${stop.startTime} ${stop.place.subCategory || stop.place.category}`,
  }));

  // 나머지 장소 있으면 표시
  if (stops.length > 3) {
    items.push({
      item: `외 ${stops.length - 3}곳 더...`,
      itemOp: '',
    });
  }

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'list',
      headerTitle: `📍 일단나와 코스 추천`,
      headerLink: {
        mobileWebUrl: window.location.href,
        webUrl: window.location.href,
      },
      contents: stops.slice(0, 3).map((stop) => ({
        title: stop.place.name,
        description: `${stop.startTime} | ${stop.place.subCategory || ''} | ${formatCost(stop.estimatedCost)}`,
        imageUrl: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=' + encodeURIComponent(stop.place.name.slice(0, 4)),
        link: {
          mobileWebUrl: stop.place.externalData?.kakaoPlace?.placeUrl || stop.place.mapUrl,
          webUrl: stop.place.externalData?.kakaoPlace?.placeUrl || stop.place.mapUrl,
        },
      })),
      buttons: [
        {
          title: '코스 전체 보기',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('[KakaoShare] 공유 실패:', error);
    return false;
  }
}

/**
 * 코스를 간단한 피드 형태로 카카오톡 공유합니다.
 * (리스트 템플릿이 동작하지 않을 경우 대안)
 */
export function shareCourseAsFeed(course: Course): boolean {
  if (!initKakaoSDK()) return false;

  const stops = course.stops;
  const totalCost = formatCost(course.totalCostPerPerson);
  const routeText = stops.map((s) => s.place.name).join(' → ');

  try {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '📍 일단나와 코스 추천',
        description: `${routeText}\n\n💰 ${totalCost} | 🕐 ${stops[0]?.startTime}~${stops[stops.length - 1]?.endTime} | ${stops.length}곳`,
        imageUrl: 'https://via.placeholder.com/600x400/6366f1/ffffff?text=' + encodeURIComponent('일단나와'),
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
      itemContent: {
        items: stops.slice(0, 5).map((stop, i) => ({
          item: `${i + 1}. ${stop.place.name}`,
          itemOp: stop.startTime,
        })),
      },
      buttons: [
        {
          title: '코스 보기',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        {
          title: '첫 번째 장소 지도',
          link: {
            mobileWebUrl: stops[0]?.place.externalData?.kakaoPlace?.placeUrl || stops[0]?.place.mapUrl || '',
            webUrl: stops[0]?.place.externalData?.kakaoPlace?.placeUrl || stops[0]?.place.mapUrl || '',
          },
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('[KakaoShare] 피드 공유 실패:', error);
    return false;
  }
}

/**
 * 카카오 SDK 사용 가능 여부
 */
export function isKakaoShareReady(): boolean {
  return !!window.Kakao;
}
