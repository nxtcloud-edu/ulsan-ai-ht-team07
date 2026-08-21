import { useApp } from '../context/AppContext';
import { getCurrentTime } from '../utils/time';

export default function TimeSelector() {
  const { state, updatePreferences } = useApp();
  const { startTime, endTime, groupSize } = state.preferences;

  const handleStartTimeChange = (value: string) => {
    if (value === 'now') {
      updatePreferences({ startTime: 'now' });
    } else {
      updatePreferences({ startTime: value });
    }
  };

  return (
    <section aria-labelledby="time-label" className="space-y-3">
      <h2 id="time-label" className="text-lg font-semibold text-navy">
        언제, 몇 명이요?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 인원 */}
        <div className="space-y-1.5">
          <label htmlFor="group-size" className="text-sm text-gray-600 font-medium">
            인원
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updatePreferences({ groupSize: Math.max(1, groupSize - 1) })}
              className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center
                hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300
                disabled:opacity-40"
              disabled={groupSize <= 1}
              aria-label="인원 줄이기"
            >
              −
            </button>
            <span
              id="group-size"
              className="w-12 text-center text-lg font-semibold"
              aria-live="polite"
            >
              {groupSize}명
            </span>
            <button
              onClick={() => updatePreferences({ groupSize: Math.min(15, groupSize + 1) })}
              className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center
                hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-300
                disabled:opacity-40"
              disabled={groupSize >= 15}
              aria-label="인원 늘리기"
            >
              +
            </button>
          </div>
        </div>

        {/* 시작 시간 */}
        <div className="space-y-1.5">
          <label htmlFor="start-time" className="text-sm text-gray-600 font-medium">
            시작 시간
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleStartTimeChange('now')}
              className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                ${startTime === 'now'
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white hover:border-primary-200'
                }
                focus:outline-none focus:ring-2 focus:ring-primary-300`}
            >
              지금
            </button>
            <input
              id="start-time"
              type="time"
              value={startTime === 'now' ? getCurrentTime() : startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm
                focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>

        {/* 종료 시간 */}
        <div className="space-y-1.5">
          <label htmlFor="end-time" className="text-sm text-gray-600 font-medium">
            종료 시간 <span className="text-gray-400">(선택)</span>
          </label>
          <input
            id="end-time"
            type="time"
            value={endTime || ''}
            onChange={(e) => updatePreferences({ endTime: e.target.value || undefined })}
            placeholder="미입력시 3시간"
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm
              focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200
              placeholder:text-gray-400"
          />
          {!endTime && (
            <p className="text-xs text-gray-400">미입력시 3시간 코스</p>
          )}
        </div>
      </div>
    </section>
  );
}
