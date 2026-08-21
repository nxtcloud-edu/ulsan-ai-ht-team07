import { useEffect, useRef, useState } from 'react';
import { Course } from '../types';
import { loadKakaoMapsSDK } from '../services/kakao-map-loader';

interface CourseMapViewProps {
  course: Course;
  /** 지도 영역 높이 (CSS 값). 기본은 결과 화면용 큰 지도 높이 */
  height?: string;
}

export default function CourseMapView({ course, height = '20rem' }: CourseMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    loadKakaoMapsSDK()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const { kakao } = window;
        const stops = course.stops;
        const startCoords = course.preferences.startCoords;
        const stopPositions = stops.map((s) => new kakao.maps.LatLng(s.place.latitude, s.place.longitude));
        const startPosition = startCoords ? new kakao.maps.LatLng(startCoords.latitude, startCoords.longitude) : null;
        // 출발지가 있으면 경로/범위 계산에 같이 포함시킨다
        const positions = startPosition ? [startPosition, ...stopPositions] : stopPositions;

        const map = new kakao.maps.Map(containerRef.current, {
          center: positions[0],
          level: 6,
        });

        // 이동 경로 선
        new kakao.maps.Polyline({
          map,
          path: positions,
          strokeWeight: 4,
          strokeColor: '#8B5CF6',
          strokeOpacity: 0.8,
          strokeStyle: 'solid',
        });

        // 출발지 마커 (있으면)
        if (startPosition) {
          const startOverlay = new kakao.maps.CustomOverlay({
            map,
            position: startPosition,
            yAnchor: 1,
            content: `
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                <div style="background:#22c55e;color:#fff;border-radius:9999px;width:26px;height:26px;
                  display:flex;align-items:center;justify-content:center;font-size:14px;
                  border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.25);">
                  🚩
                </div>
                <div style="background:#fff;padding:2px 6px;border-radius:6px;font-size:11px;
                  font-weight:600;color:#166534;box-shadow:0 1px 3px rgba(0,0,0,0.2);white-space:nowrap;">
                  ${course.preferences.startPlaceName || '출발지'}
                </div>
              </div>
            `,
          });
          void startOverlay;
        }

        // 순번이 매겨진 마커
        stops.forEach((stop, i) => {
          const overlay = new kakao.maps.CustomOverlay({
            map,
            position: stopPositions[i],
            yAnchor: 1,
            content: `
              <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                <div style="background:#8B5CF6;color:#fff;border-radius:9999px;width:26px;height:26px;
                  display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;
                  border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.25);">
                  ${i + 1}
                </div>
                <div style="background:#fff;padding:2px 6px;border-radius:6px;font-size:11px;
                  font-weight:600;color:#1e1b4b;box-shadow:0 1px 3px rgba(0,0,0,0.2);white-space:nowrap;">
                  ${stop.place.name}
                </div>
              </div>
            `,
          });
          void overlay;
        });

        // 모든 마커가 보이도록 범위 조정
        const bounds = new kakao.maps.LatLngBounds();
        positions.forEach((pos: any) => bounds.extend(pos));
        map.setBounds(bounds);

        setStatus('ready');
      })
      .catch((err) => {
        console.warn('[CourseMapView] 지도 로드 실패:', err);
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [course]);

  if (status === 'error') {
    return (
      <div
        style={{ height }}
        className="w-full flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-gray-100 bg-gray-50 text-center px-3"
      >
        <p className="text-gray-500 text-sm">지도를 불러오지 못했어요.</p>
        <p className="text-xs text-gray-400">잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50"
        aria-label="코스 지도"
      />
      {status === 'loading' && (
        <p className="text-center text-xs text-gray-400">지도를 불러오는 중...</p>
      )}
    </div>
  );
}
