import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TransportType } from '../types';

const MIN_BUDGET = 10000;
const MAX_BUDGET = 10000000;
const BUDGET_STEP = 10000;

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
  const isUnlimited = selectedBudget === null;

  // 타이핑 중엔 clamp하지 않고 자유롭게 입력받다가, 입력을 끝낼 때(blur)만 범위를 보정한다.
  // (매 키 입력마다 clamp하면 "1만 원 미만"인 중간 입력값이 계속 강제로 튕겨서 타이핑이 안 됨)
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (value: number) => Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, value));

  const handleStep = (delta: number) => {
    const base = selectedBudget ?? 30000;
    updatePreferences({ budgetPerPerson: clamp(base + delta) });
  };

  const displayValue = draft !== null
    ? draft
    : isUnlimited ? '' : (selectedBudget ?? 0).toLocaleString();

  const handleDirectInput = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setDraft(digits);
    // 최솟값은 타이핑 도중엔 강제하지 않되(타이핑이 막히니까), 최댓값 초과와 실제 값 반영은 바로 해준다.
    if (digits !== '') {
      updatePreferences({ budgetPerPerson: Math.min(MAX_BUDGET, parseInt(digits, 10)) });
    }
  };

  const commitDraft = () => {
    // 입력을 마칠 때 최솟값 미만이었다면 여기서 최종 보정한다.
    if (draft !== null && draft !== '') {
      updatePreferences({ budgetPerPerson: clamp(parseInt(draft, 10)) });
    }
    setDraft(null);
  };

  return (
    <section aria-labelledby="budget-label" className="space-y-4">
      {/* 예산 */}
      <div className="space-y-3">
        <h2 id="budget-label" className="text-lg font-semibold text-navy">
          1인당 예산
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStep(-BUDGET_STEP)}
            disabled={isUnlimited || (selectedBudget ?? 0) <= MIN_BUDGET}
            className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center
              hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300
              disabled:opacity-40"
            aria-label="예산 1만 원 줄이기"
          >
            −
          </button>
          <div className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl">
            <input
              type="text"
              inputMode="numeric"
              value={displayValue}
              onChange={(e) => handleDirectInput(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              disabled={isUnlimited}
              placeholder="상관없음"
              aria-label="1인당 예산 (원)"
              className="w-full text-center text-lg font-semibold bg-transparent focus:outline-none
                disabled:text-gray-400 disabled:placeholder:text-gray-400"
            />
            <span className="text-sm text-gray-500">원</span>
          </div>
          <button
            onClick={() => handleStep(BUDGET_STEP)}
            disabled={isUnlimited || (selectedBudget ?? 0) >= MAX_BUDGET}
            className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center
              hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300
              disabled:opacity-40"
            aria-label="예산 1만 원 늘리기"
          >
            +
          </button>
        </div>
        <button
          onClick={() => updatePreferences({ budgetPerPerson: isUnlimited ? 30000 : null })}
          className={`px-4 py-2 rounded-2xl border-2 text-sm font-medium transition-all
            ${isUnlimited
              ? 'border-primary-400 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-white text-charcoal hover:border-primary-200'
            }
            focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1`}
        >
          🤷 상관없음
        </button>
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
