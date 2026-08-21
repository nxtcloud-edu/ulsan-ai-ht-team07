import { useApp } from '../context/AppContext';
import { FoodPreference } from '../types';

const foodOptions: { value: FoodPreference; emoji: string }[] = [
  { value: '한식', emoji: '🍚' },
  { value: '중식', emoji: '🥟' },
  { value: '일식', emoji: '🍣' },
  { value: '양식', emoji: '🍝' },
  { value: '분식', emoji: '🍢' },
  { value: '아시안', emoji: '🍜' },
  { value: '고기·구이', emoji: '🥩' },
  { value: '패스트푸드', emoji: '🍔' },
];

export default function FoodPreferenceSelector() {
  const { state, updatePreferences } = useApp();
  const selected = state.preferences.foodPreference;

  return (
    <section aria-labelledby="food-label" className="space-y-3">
      <h2 id="food-label" className="text-lg font-semibold text-navy">
        지금 뭐 땡겨요? <span className="text-sm text-gray-400 font-normal">(선택)</span>
      </h2>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="food-label">
        {foodOptions.map(({ value, emoji }) => (
          <button
            key={value}
            role="radio"
            aria-checked={selected === value}
            onClick={() => updatePreferences({ foodPreference: value })}
            className={`px-3.5 py-2 rounded-2xl border-2 text-sm font-medium transition-all flex items-center gap-1.5
              ${selected === value
                ? 'border-primary-400 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-charcoal hover:border-primary-200'
              }
              focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1`}
          >
            <span aria-hidden="true">{emoji}</span>
            {value}
          </button>
        ))}
        <button
          role="radio"
          aria-checked={selected === null}
          onClick={() => updatePreferences({ foodPreference: null })}
          className={`px-3.5 py-2 rounded-2xl border-2 text-sm font-medium transition-all flex items-center gap-1.5
            ${selected === null
              ? 'border-primary-400 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-white text-charcoal hover:border-primary-200'
            }
            focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1`}
        >
          <span aria-hidden="true">🤷</span>
          상관없음
        </button>
      </div>
    </section>
  );
}
