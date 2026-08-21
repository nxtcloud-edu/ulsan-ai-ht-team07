import { useApp } from '../context/AppContext';
import { DesiredActivity } from '../types';

const activities: { value: DesiredActivity; emoji: string }[] = [
  { value: '먹기', emoji: '🍽️' },
  { value: '카페', emoji: '☕' },
  { value: '활동적인 체험', emoji: '🎳' },
  { value: '소품샵', emoji: '🎁' },
  { value: '사진', emoji: '📸' },
  { value: '산책', emoji: '🌿' },
  { value: '문화생활', emoji: '🎨' },
  { value: '술', emoji: '🍺' },
  { value: '랜덤', emoji: '🎲' },
];

export default function ActivityTags() {
  const { state, updatePreferences } = useApp();
  const selected = state.preferences.desiredActivities;

  const toggle = (activity: DesiredActivity) => {
    if (activity === '랜덤') {
      updatePreferences({ desiredActivities: ['랜덤'] });
      return;
    }

    const filtered = selected.filter((a) => a !== '랜덤');
    if (filtered.includes(activity)) {
      updatePreferences({ desiredActivities: filtered.filter((a) => a !== activity) });
    } else {
      updatePreferences({ desiredActivities: [...filtered, activity] });
    }
  };

  return (
    <section aria-labelledby="activity-label" className="space-y-3">
      <h2 id="activity-label" className="text-lg font-semibold text-navy">
        원하는 활동 <span className="text-sm text-gray-400 font-normal">(선택)</span>
      </h2>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="activity-label">
        {activities.map(({ value, emoji }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              aria-pressed={isSelected}
              onClick={() => toggle(value)}
              className={`px-3.5 py-2 rounded-2xl border-2 text-sm font-medium transition-all flex items-center gap-1.5
                ${isSelected
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-charcoal hover:border-primary-200'
                }
                focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1`}
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
