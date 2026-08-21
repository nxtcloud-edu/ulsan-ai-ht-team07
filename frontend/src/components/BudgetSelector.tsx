import { useApp } from '../context/AppContext';
import { TransportType } from '../types';

const budgetOptions: { value: number | null; label: string }[] = [
  { value: 10000, label: '1만 원 이하' },
  { value: 30000, label: '3만 원 이하' },
  { value: 50000, label: '5만 원 이하' },
  { value: 100000, label: '10만 원 이하' },
  { value: null, label: '상관없음' },
];

const transportOptions: { value: TransportType; label: string; emoji: string }[] = [
  { value: 'walk', label: '도보', emoji: '🚶' },
  { value: 'public', label: '대중교통', emoji: '🚌' },
  { value: 'car', label: '자동차', emoji: '🚗' },
  { value: 'any', label: '상관없음', emoji: '🤷' },
];

export default function BudgetSelector() {
  const { state, updatePreferences } = useApp();
  const selectedBudget = state.preferences.budgetPerPerson;
  const selectedTransport = state.preferences.transport;

  return (
    <section aria-labelledby="budget-label" className="space-y-4">
      {/* 예산 */}
      <div className="space-y-3">
        <h2 id="budget-label" className="text-lg font-semibold text-navy">
          1인당 예산
        </h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="budget-label">
          {budgetOptions.map(({ value, label }) => (
            <button
              key={label}
              role="radio"
              aria-checked={selectedBudget === value}
              onClick={() => updatePreferences({ budgetPerPerson: value })}
              className={`px-4 py-2.5 rounded-2xl border-2 text-sm font-medium transition-all
                ${selectedBudget === value
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-charcoal hover:border-primary-200'
                }
                focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 이동수단 */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-navy">이동수단</h3>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="이동수단 선택">
          {transportOptions.map(({ value, label, emoji }) => (
            <button
              key={value}
              role="radio"
              aria-checked={selectedTransport === value}
              onClick={() => updatePreferences({ transport: value })}
              className={`px-4 py-2.5 rounded-2xl border-2 text-sm font-medium transition-all flex items-center gap-1.5
                ${selectedTransport === value
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-charcoal hover:border-primary-200'
                }
                focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1`}
            >
              <span aria-hidden="true">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
