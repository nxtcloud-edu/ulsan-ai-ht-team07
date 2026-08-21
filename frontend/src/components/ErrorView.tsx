import { useApp } from '../context/AppContext';
import { RecommendationError } from '../types';
import { generateCourseAsync } from '../services/recommendation-engine';

interface ErrorViewProps {
  error: RecommendationError;
}

export default function ErrorView({ error }: ErrorViewProps) {
  const { updatePreferences, setCourse, setError, setLoading, state } = useApp();

  const handleSuggestion = async (index: number) => {
    const suggestion = error.suggestions[index];
    if (!suggestion) return;

    setLoading(true);
    const newPrefs = suggestion.action();
    updatePreferences(newPrefs);

    const result = await generateCourseAsync(newPrefs);
    if (result.success && result.course) {
      setCourse(result.course);
    } else if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleRetry = async () => {
    setLoading(true);
    setError(null);

    const result = await generateCourseAsync(state.preferences);
    if (result.success && result.course) {
      setCourse(result.course);
    } else if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="text-center py-8 space-y-6">
      <div className="text-5xl" aria-hidden="true">😅</div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-navy">{error.message}</h2>
        <p className="text-sm text-gray-500">
          조건을 조금 완화하면 코스를 만들 수 있을 거예요
        </p>
      </div>

      {/* 조건 완화 제안 */}
      {error.suggestions.length > 0 && (
        <div className="space-y-2 max-w-sm mx-auto">
          {error.suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestion(index)}
              className="w-full py-3 px-4 text-sm font-medium text-primary-700 bg-primary-50 rounded-2xl
                border-2 border-primary-200 hover:bg-primary-100 transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleRetry}
        className="text-sm text-gray-500 underline hover:text-gray-700"
      >
        현재 조건으로 다시 시도
      </button>
    </div>
  );
}
