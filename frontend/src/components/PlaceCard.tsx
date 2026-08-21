import { CourseStop, NaverBlogReview } from '../types';
import { formatCost } from '../utils/cost';
import { formatDistance, formatTravelTime } from '../utils/distance';
import { getMapService } from '../services/map-service';
import { getNaverSearchUrl } from '../services/naver-blog-service';
import { getKakaoMapSearchUrl } from '../services/kakao-local-service';
import { getBestInstagramUrl, generateInstagramKeywords } from '../services/instagram-service';

interface PlaceCardProps {
  stop: CourseStop;
  isFirst: boolean;
}

export const categoryLabels: Record<string, string> = {
  restaurant: '식사',
  cafe: '카페',
  bowling: '볼링',
  escape_room: '방탈출',
  board_game: '보드게임',
  accessories_shop: '소품샵',
  keyring_shop: '키링샵',
  craft_workshop: '공방',
  exhibition: '전시',
  walk: '산책',
  karaoke: '노래방',
  photo_studio: '사진',
  bar: '술집',
  park: '공원',
  shopping: '쇼핑',
};

/** 블로그 후기 미리보기 컴포넌트 */
function BlogReviewPreview({ reviews }: { reviews: NaverBlogReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {reviews.slice(0, 2).map((review, idx) => (
        <a
          key={idx}
          href={review.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-3 py-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          <p className="text-xs font-medium text-green-800 line-clamp-1">
            {review.title}
          </p>
          <p className="text-[11px] text-green-600 line-clamp-1 mt-0.5">
            {review.description}
          </p>
          <p className="text-[10px] text-green-500 mt-0.5">
            {review.bloggerName} · {review.postDate}
          </p>
        </a>
      ))}
    </div>
  );
}

/** 외부 링크 버튼들 */
function ExternalLinks({ placeName, neighborhood, region, category, externalData }: {
  placeName: string;
  neighborhood: string;
  region: string;
  category: string;
  externalData?: CourseStop['place']['externalData'];
}) {
  // 카카오맵 URL: externalData에서 가져오거나 검색 URL 생성
  const kakaoUrl = externalData?.kakaoPlace?.placeUrl
    || getKakaoMapSearchUrl(placeName, region);

  // 네이버 블로그 검색 URL
  const naverUrl = externalData?.naverSearchUrl
    || getNaverSearchUrl(placeName, region);

  // 인스타그램 해시태그 URL
  const instagramUrl = externalData?.instagramHashtagUrl
    || getBestInstagramUrl(placeName, category as any, neighborhood);

  // 인스타 키워드 표시
  const instagramKeywords = externalData?.instagramKeywords
    || generateInstagramKeywords(placeName, category as any, neighborhood, region).slice(0, 3);

  return (
    <div className="space-y-2">
      {/* 인스타 키워드 태그 */}
      <div className="flex flex-wrap gap-1">
        {instagramKeywords.map((keyword, idx) => (
          <span
            key={idx}
            className="text-[10px] text-pink-500 bg-pink-50 px-1.5 py-0.5 rounded-full"
          >
            #{keyword}
          </span>
        ))}
      </div>

      {/* 외부 링크 버튼 */}
      <div className="flex gap-2">
        <a
          href={naverUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-1.5 text-[11px] text-center font-medium text-green-700 bg-green-50 rounded-lg
            hover:bg-green-100 transition-colors"
          aria-label={`${placeName} 네이버 후기 보기`}
        >
          📝 네이버 후기
        </a>
        <a
          href={kakaoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-1.5 text-[11px] text-center font-medium text-yellow-700 bg-yellow-50 rounded-lg
            hover:bg-yellow-100 transition-colors"
          aria-label={`${placeName} 카카오맵 후기 보기`}
        >
          🗺️ 카카오맵 후기
        </a>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-1.5 text-[11px] text-center font-medium text-pink-700 bg-pink-50 rounded-lg
            hover:bg-pink-100 transition-colors"
          aria-label={`${placeName} 인스타그램 보기`}
        >
          📷 인스타
        </a>
      </div>
    </div>
  );
}

export default function PlaceCard({ stop, isFirst }: PlaceCardProps) {
  const mapService = getMapService();
  const externalData = stop.place.externalData;
  const blogReviews = externalData?.naverBlogReviews || [];

  return (
    <article className="card space-y-3" aria-label={`${stop.place.name} - ${stop.startTime}`}>
      {/* 이동 정보 */}
      {!isFirst && stop.travelTimeFromPrev > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400 -mt-1 pb-1 border-b border-dashed border-gray-100">
          <span>🚶</span>
          <span>{formatDistance(stop.distanceFromPrev)}</span>
          <span>·</span>
          <span>{formatTravelTime(stop.travelTimeFromPrev)}</span>
        </div>
      )}

      {/* 시간 + 카테고리 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary-600">{stop.startTime}</span>
          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
            {categoryLabels[stop.place.category] || stop.place.category}
          </span>
        </div>
        <div className="text-right text-xs text-gray-400">
          {stop.duration}분 체류
        </div>
      </div>

      {/* 장소 정보 */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-navy flex items-center gap-1.5">
          {stop.place.name}
          {stop.place.verified && !stop.place.isSample && (
            <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
              실제 장소
            </span>
          )}
          {stop.place.isSample && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              샘플
            </span>
          )}
        </h3>
        {stop.place.address && !stop.place.isSample && (
          <p className="text-[11px] text-gray-400">{stop.place.address}</p>
        )}
        {stop.place.subCategory && (
          <p className="text-xs text-gray-500">{stop.place.subCategory}</p>
        )}
      </div>

      {/* 추천 이유 */}
      <p className="text-sm text-gray-600 bg-cream rounded-xl px-3 py-2 leading-relaxed">
        💡 {stop.recommendReason}
      </p>

      {/* 네이버 블로그 후기 미리보기 (API 연동 시) */}
      {blogReviews.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] text-gray-400 font-medium">블로그 후기</p>
          <BlogReviewPreview reviews={blogReviews} />
        </div>
      )}

      {/* 상세 정보 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        <span>💰 {formatCost(stop.estimatedCost)} (추정)</span>
        <span>{stop.place.indoor ? '🏠 실내' : '🌤️ 야외'}</span>
        {stop.place.parking && <span>🅿️ 주차가능</span>}
        {stop.place.reservationRequired && <span>📞 예약 필요</span>}
        {stop.place.mapUrl && (
          <a
            href={stop.place.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            🍽️ 실제 메뉴·가격 보기
          </a>
        )}
      </div>

      {/* 외부 후기 링크 (네이버/카카오/인스타) */}
      <ExternalLinks
        placeName={stop.place.name}
        neighborhood={stop.place.neighborhood}
        region={stop.place.district ? `${stop.place.city} ${stop.place.district}` : stop.place.city}
        category={stop.place.category}
        externalData={externalData}
      />

      {/* 지도 버튼 */}
      <button
        onClick={() => mapService.openInMap(stop.place)}
        className="w-full py-2 text-sm text-primary-600 font-medium rounded-xl border border-primary-200
          hover:bg-primary-50 transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-300"
        aria-label={`${stop.place.name} 지도에서 보기`}
      >
        📍 지도에서 보기
      </button>
    </article>
  );
}
