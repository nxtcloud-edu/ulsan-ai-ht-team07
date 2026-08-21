import { useApp } from '../context/AppContext';
import { AvoidCondition } from '../types';

const avoidOptions: { value: AvoidCondition; emoji: string }[] = [
  { value: '긴 웨이팅', emoji: '⏳' },
  { value: '야외', emoji: '☀️' },
  { value: '술', emoji: '🚫' },
  { value: '매운 음식', emoji: '🌶️' },
  { value: '많이 걷기', emoji: '🦶' },
  { value: '시끄러운 장소', emoji: '🔇' },
];

export default function AvoidanceTags() {
  const { state, updatePreferences } = useApp();
  const selected = state.preferences.avoidConditions;

  const toggle = (condition: AvoidCondition) => {
    if (selected.includes(condition)) {
      updatePreferences({ avoidConditions: selected.filter((c) => c !== condition) });
    } else {
      updatePreferences({ avoidConditions: [...selected, condition] });
    }
  };

  return (
    <section aria-labelledby="avoid-label" className="space-y-3">
      <h2 id="avoid-label" className="text-lg font-semibold text-navy">
        피하고 싶은 조건 <span className="text-sm text-gray-400 font-normal">(선택)</span>
      </h2>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="avoid-label">
        {avoidOptions.map(({ value, emoji }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              aria-pressed={isSelected}
              onClick={() => toggle(value)}
              className={`px-3.5 py-2 rounded-2xl border-2 text-sm font-medium transition-all flex items-center gap-1.5
                ${isSelected
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-charcoal hover:border-red-200'
                }
                focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1`}
            >
              <span aria-hidden="true">{emoji}</span>
              {value}
            </button>
          );
        })}
      </div>
    </section>
  );
}
