import { useApp } from '../context/AppContext';
import { QuickPreset } from '../types';
import { quickPresets, getPresetPreferences } from '../services/quick-presets';
import { generateCourseOptionsAsync } from '../services/recommendation-engine';

export default function QuickRecommendation() {
  const { updatePreferences, setCourseOptions, setLoading, setError } = useApp();

  const handleQuickSelect = async (presetId: QuickPreset) => {
    setLoading(true);
    const prefs = getPresetPreferences(presetId);
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
    <section aria-labelledby="quick-label" className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 id="quick-label" className="text-lg font-semibold text-navy">
          생각하기도 귀찮아요
        </h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          빠른 추천
        </span>
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
