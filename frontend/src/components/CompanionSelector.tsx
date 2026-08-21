import { useApp } from '../context/AppContext';
import { CompanionType } from '../types';

const companions: { value: CompanionType; label: string; emoji: string }[] = [
  { value: 'solo', label: '혼자', emoji: '🎧' },
  { value: 'couple', label: '연인', emoji: '💑' },
  { value: 'friend', label: '친구', emoji: '👫' },
  { value: 'parent', label: '부모님', emoji: '👨‍👩‍👧' },
  { value: 'coworker', label: '직장동료', emoji: '👔' },
];

export default function CompanionSelector() {
  const { state, updatePreferences } = useApp();
  const selected = state.preferences.companion;

  return (
    <section aria-labelledby="companion-label" className="space-y-3">
      <h2 id="companion-label" className="text-lg font-semibold text-navy">
        오늘 누구와 놀아요?
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" role="radiogroup" aria-labelledby="companion-label">
        {companions.map(({ value, label, emoji }) => (
          <button
            key={value}
            role="radio"
            aria-checked={selected === value}
            onClick={() => updatePreferences({ companion: value })}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200
              ${selected === value
                ? 'border-primary-400 bg-primary-50 shadow-sm scale-[1.02]'
                : 'border-gray-200 bg-white hover:border-primary-200 hover:bg-primary-50/50'
              }
              focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1
              min-h-[72px]`}
          >
            <span className="text-2xl" aria-hidden="true">{emoji}</span>
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
