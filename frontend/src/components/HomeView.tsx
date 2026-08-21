import { useApp } from '../context/AppContext';
import { generateCourseOptionsAsync } from '../services/recommendation-engine';
import CompanionSelector from './CompanionSelector';
import LocationSelector from './LocationSelector';
import TimeSelector from './TimeSelector';
import BudgetSelector from './BudgetSelector';
import ActivityTags from './ActivityTags';
import FoodPreferenceSelector from './FoodPreferenceSelector';
import AvoidanceTags from './AvoidanceTags';

export default function HomeView() {
  const { state, updatePreferences, setCourseOptions, setLoading, setError, setView } = useApp();

  const handleGenerate = async () => {
    setLoading(true);

    const result = await generateCourseOptionsAsync(state.preferences);
    if (result.success && result.courses) {
      setCourseOptions(result.courses);
    } else if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 히어로 */}
      <section className="text-center space-y-2 pt-4">
        <h1 className="text-3xl font-bold text-navy">일단나와</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          약속만 잡으세요. 계획은 일단나와가 짜드립니다.
        </p>
      </section>

      {/* 모드 선택 */}
      <section className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setView('chat')}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-primary-200 bg-primary-50
            hover:border-primary-400 hover:shadow-md transition-all
            focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <span className="text-2xl">💬</span>
          <span className="text-sm font-semibold text-primary-700">대화로 코스 만들기</span>
          <span className="text-[11px] text-gray-500">말만 하면 알아서 짜줘요</span>
        </button>
        <div
          className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 bg-white
            opacity-90"
        >
          <span className="text-2xl">🎛️</span>
          <span className="text-sm font-semibold text-charcoal">직접 선택하기</span>
          <span className="text-[11px] text-gray-500">아래에서 조건 설정</span>
        </div>
      </section>

      {/* 구분선 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">직접 설정하기</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 입력 영역 */}
      <div className="space-y-6">
        <CompanionSelector />
        <LocationSelector />
        <TimeSelector />
        <BudgetSelector />
        <ActivityTags />
        <FoodPreferenceSelector />
        <AvoidanceTags />

        {/* 추가 요청 */}
        <section className="space-y-2">
          <label htmlFor="additional-request" className="text-sm font-medium text-gray-600">
            추가 요청 <span className="text-gray-400">(선택)</span>
          </label>
          <textarea
            id="additional-request"
            value={state.preferences.additionalRequest || ''}
            onChange={(e) => updatePreferences({ additionalRequest: e.target.value })}
            placeholder="예: 비가 오니까 야외는 빼줘, 볼링 같은 활동 넣어줘"
            rows={2}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm resize-none
              focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200
              placeholder:text-gray-400"
          />
        </section>
      </div>

      {/* 생성 버튼 */}
      <div className="sticky bottom-4 pt-4">
        <button
          onClick={handleGenerate}
          className="w-full py-4 bg-primary-500 hover:bg-primary-600 active:bg-primary-700
            text-white text-lg font-bold rounded-3xl shadow-lg shadow-primary-200
            transition-all duration-200 active:scale-[0.98]
            focus:outline-none focus:ring-4 focus:ring-primary-300"
          aria-label="코스 생성하기"
        >
          일단 나와
        </button>
      </div>
    </div>
  );
}
