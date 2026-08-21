import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { MustVisitPlace } from '../types';
import { searchKakaoPlace } from '../services/kakao-local-service';
import { KakaoPlaceInfo } from '../types';

/** 카카오 장소 검색 결과 드롭다운 */
function PlaceSearchInput({
  placeholder,
  value,
  onSelect,
  onClear,
}: {
  placeholder: string;
  value: string;
  onSelect: (place: KakaoPlaceInfo) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KakaoPlaceInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const places = await searchKakaoPlace(text, { size: 5 });
    setResults(places);
    setShowResults(true);
    setIsSearching(false);
  }, []);

  const handleSelect = (place: KakaoPlaceInfo) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onSelect(place);
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 border-2 border-primary-200 rounded-2xl">
        <span className="flex-1 text-sm font-medium text-primary-700">{value}</span>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          aria-label="선택 해제"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm
          focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200
          placeholder:text-gray-400"
      />
      {isSearching && (
        <div className="absolute right-4 top-3.5 text-xs text-gray-400">검색중...</div>
      )}

      {/* 검색 결과 드롭다운 */}
      {showResults && results.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {results.map((place) => (
            <li key={place.kakaoId}>
              <button
                onMouseDown={() => handleSelect(place)}
                className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-b-0"
              >
                <p className="text-sm font-medium text-navy">{place.placeName}</p>
                <p className="text-[11px] text-gray-400">{place.roadAddressName || place.addressName}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LocationSelector() {
  const { state, updatePreferences } = useApp();
  const mustVisitPlaces = state.preferences.mustVisitPlaces || [];

  const handleRegionSelect = (place: KakaoPlaceInfo) => {
    // 지역이 바뀌면 이전 지역 기준으로 골랐던 출발지/꼭 가고 싶은 곳은 더 이상 유효하지 않으므로 초기화
    updatePreferences({
      location: place.roadAddressName || place.addressName || place.placeName,
      locationCoords: { latitude: place.latitude, longitude: place.longitude },
      startPlaceName: undefined,
      startCoords: undefined,
      mustVisitPlaces: [],
    });
  };

  const handleRegionClear = () => {
    updatePreferences({ location: '', locationCoords: undefined });
  };

  const handleStartPlaceSelect = (place: KakaoPlaceInfo) => {
    updatePreferences({
      startPlaceName: place.placeName,
      startCoords: { latitude: place.latitude, longitude: place.longitude },
    });
  };

  const handleStartPlaceClear = () => {
    updatePreferences({
      startPlaceName: undefined,
      startCoords: undefined,
    });
  };

  const handleMustVisitSelect = (place: KakaoPlaceInfo) => {
    const newPlace: MustVisitPlace = {
      name: place.placeName,
      kakaoId: place.kakaoId,
      latitude: place.latitude,
      longitude: place.longitude,
      placeUrl: place.placeUrl,
    };
    updatePreferences({
      mustVisitPlaces: [...mustVisitPlaces, newPlace],
    });
  };

  const handleMustVisitRemove = (index: number) => {
    const updated = mustVisitPlaces.filter((_, i) => i !== index);
    updatePreferences({ mustVisitPlaces: updated });
  };

  return (
    <section aria-labelledby="location-label" className="space-y-3">
      <h2 id="location-label" className="text-lg font-semibold text-navy">
        어디서 놀아요?
      </h2>
      <PlaceSearchInput
        placeholder="지역을 검색하세요 (예: 서울 강남구, 부산 해운대, 울산 삼산동...)"
        value={state.preferences.location}
        onSelect={handleRegionSelect}
        onClear={handleRegionClear}
      />

      {/* 출발지 설정 */}
      <div className="space-y-2 pt-2">
        <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
          📍 출발지 <span className="text-gray-400 text-xs">(선택)</span>
        </label>
        <PlaceSearchInput
          placeholder="출발할 장소를 검색하세요 (예: 울산대학교, 내 집 근처역...)"
          value={state.preferences.startPlaceName || ''}
          onSelect={handleStartPlaceSelect}
          onClear={handleStartPlaceClear}
        />
      </div>

      {/* 꼭 가고 싶은 곳 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
          ⭐ 꼭 가고 싶은 곳 <span className="text-gray-400 text-xs">(선택, 최대 3곳)</span>
        </label>

        {/* 이미 추가된 장소들 */}
        {mustVisitPlaces.map((place, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 border-2 border-yellow-200 rounded-2xl"
          >
            <span className="text-sm">⭐</span>
            <span className="flex-1 text-sm font-medium text-yellow-800">{place.name}</span>
            <button
              onClick={() => handleMustVisitRemove(index)}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              aria-label={`${place.name} 제거`}
            >
              ✕
            </button>
          </div>
        ))}

        {/* 검색 입력 (3곳 미만일 때만) */}
        {mustVisitPlaces.length < 3 && (
          <PlaceSearchInput
            placeholder="가고 싶은 장소를 검색하세요 (예: 초석로스터스, 롯데시네마...)"
            value=""
            onSelect={handleMustVisitSelect}
            onClear={() => {}}
          />
        )}
      </div>
    </section>
  );
}
