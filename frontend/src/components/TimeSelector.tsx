import { useApp } from '../context/AppContext';
import { getCurrentTime, getTodayDate, addDaysToDate, formatDateLabel } from '../utils/time';

const dateQuickOptions = [
  { offset: 0, label: '오늘' },
  { offset: 1, label: '내일' },
  { offset: 2, label: '모레' },
];

export default function TimeSelector() {
  const { state, updatePreferences } = useApp();
  const { date, startTime, endTime, groupSize } = state.preferences;
  const today = getTodayDate();

  const handleStartTimeChange = (value: string) => {
    if (value === 'now') {
      updatePreferences({ startTime: 'now' });
    } else {
      updatePreferences({ startTime: value });
    }
  };

  const handleDateChange = (value: string) => {
    // 오늘이 아닌 날짜인데 시작 시간이 "지금"이면 의미가 없으니 현재 시각으로 고정해준다
    if (value !== today && startTime === 'now') {
      updatePreferences({ date: value, startTime: getCurrentTime() });
    } else {
      updatePreferences({ date: value });
    }
  };

  return (
    <section aria-labelledby="time-label" className="space-y-3">
      <h2 id="time-label" className="text-lg font-semibold text-navy">
        언제, 몇 명이요?
      </h2>

      {/* 날짜 */}
      <div className="space-y-1.5">
        <label className="text-sm text-gray-600 font-medium">날짜</label>
        <div className="flex flex-wrap gap-2">
          {dateQuickOptions.map(({ offset, label }) => {
            const value = addDaysToDate(today, offset);
            const isSelected = date === value;
            return (
              <button
                key={offset}
                onClick={() => handleDateChange(value)}
                className={`px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition-all
                  ${isSelected
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white hover:border-primary-200'
                  }
                  focus:outline-none focus:ring-2 focus:ring-primary-300`}
              >
                {label}
              </button>
            );
          })}
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => e.target.value && handleDateChange(e.target.value)}
            className="flex-1 min-w-[9rem] px-3 py-2 border-2 border-gray-200 rounded-xl text-sm
              focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
            aria-label="직접 날짜 선택"
          />
        </div>
        <p className="text-xs text-gray-400">{formatDateLabel(date)}</p>
      </div>

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
              disabled={date !== today}
              className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                ${startTime === 'now'
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white hover:border-primary-200'
                }
                focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-40 disabled:cursor-not-allowed`}
              title={date !== today ? '오늘 날짜에서만 사용할 수 있어요' : undefined}
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
