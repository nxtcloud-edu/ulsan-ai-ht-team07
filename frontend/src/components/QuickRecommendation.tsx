import { useApp } from '../context/AppContext';
import { QuickPreset } from '../types';
import { quickPresets, getPresetPreferences } from '../services/quick-presets';
import { generateCourseOptionsAsync } from '../services/recommendation-engine';

export default function QuickRecommendation() {
  const { state, updatePreferences, setCourseOptions, setLoading, setError } = useApp();

  const handleQuickSelect = async (presetId: QuickPreset) => {
    setLoading(true);
    const preset = getPresetPreferences(presetId);
    // 프리셋의 companion/시간/예산/활동 등은 그대로 적용하되, 사용자가 이미 직접 골라둔
    // 지역/출발지/꼭 가고 싶은 곳/음식 취향은 프리셋의 하드코딩된 기본값으로 덮어쓰지 않는다.
    const prefs = {
      ...preset,
      location: state.preferences.location || preset.location,
      locationCoords: state.preferences.locationCoords ?? preset.locationCoords,
      startPlaceName: state.preferences.startPlaceName,
      startCoords: state.preferences.startCoords,
      mustVisitPlaces: state.preferences.mustVisitPlaces,
      foodPreference: state.preferences.foodPreference,
    };
    updatePreferences(prefs);

    const result = await generateCourseOptionsAsync(prefs);
    if (result.success && result.courses) {
      setCourseOptions(result.courses);
    } else if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <section aria-label="빠른 추천" className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-navy">
          빠른 추천
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quickPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleQuickSelect(preset.id)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-gray-200 bg-white
              hover:border-primary-300 hover:bg-primary-50/50 active:scale-[0.97]
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1"
            aria-label={`${preset.label} - ${preset.description}`}
          >
            <span className="text-xl" aria-hidden="true">{preset.emoji}</span>
            <span className="text-xs font-medium text-charcoal">{preset.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
