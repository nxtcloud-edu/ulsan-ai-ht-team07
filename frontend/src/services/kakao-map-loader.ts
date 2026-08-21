/**
 * 카카오맵 JS SDK 동적 로더
 *
 * 카카오톡 공유용 SDK(index.html에서 항상 로드)와는 별개로,
 * 지도가 실제로 필요한 화면에서만 스크립트를 불러온다.
 *
 * 카카오 개발자센터에서 해당 앱에 "카카오맵" 제품이 활성화돼 있어야 동작한다.
 */

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || '';

let loadPromise: Promise<void> | null = null;

export function loadKakaoMapsSDK(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!KAKAO_JS_KEY) {
      reject(new Error('VITE_KAKAO_JS_KEY가 설정되지 않았습니다.'));
      return;
    }

    if (window.kakao?.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error('카카오맵 SDK 로드에 실패했습니다.'));
    document.head.appendChild(script);
  });

  // 실패하면 다음에 다시 시도할 수 있도록 캐시를 비운다.
  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}
