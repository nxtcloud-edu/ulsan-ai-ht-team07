import { Course } from '../types';
import { useApp } from '../context/AppContext';
import { formatCost } from '../utils/cost';
import { formatTravelTime } from '../utils/distance';
import { categoryLabels } from './PlaceCard';
import CourseMapView from './CourseMapView';
import { formatDateLabel } from '../utils/time';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function OptionCard({ course, index, onSelect }: { course: Course; index: number; onSelect: () => void }) {
  const flow = course.stops
    .map((s) => categoryLabels[s.place.category] || s.place.category)
    .join(' → ');

  return (
    <div className="card space-y-3 border-2 border-gray-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-primary-600">{course.name || `코스 ${index + 1}`}</span>
        <span className="text-xs text-gray-400">{course.stops.length}곳</span>
      </div>

      <p className="text-sm font-medium text-navy">{flow}</p>

      <div className="flex flex-wrap gap-1.5">
        {course.stops.map((s) => (
          <span key={s.id} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">
            {s.place.name}
          </span>
        ))}
      </div>

      {/* 코스 미리보기 지도 */}
      <CourseMapView course={course} height="12rem" />

      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <div>
          <p className="text-[11px] text-gray-400">1인 비용</p>
          <p className="text-sm font-semibold text-navy">{formatCost(course.totalCostPerPerson)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">총 소요</p>
          <p className="text-sm font-semibold text-navy">{formatDuration(course.totalDuration)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">이동시간</p>
          <p className="text-sm font-semibold text-navy">{formatTravelTime(course.totalTravelTime)}</p>
        </div>
      </div>

      <button
        onClick={onSelect}
        className="w-full py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 rounded-xl
          hover:bg-primary-100 active:scale-[0.99] transition-all
          focus:outline-none focus:ring-2 focus:ring-primary-300"
        aria-label={`코스 ${index + 1} 선택하기`}
      >
        이 코스로 갈래요
      </button>
    </div>
  );
}

export default function CourseOptionsView() {
  const { state, setCourse, setView } = useApp();
  const { courseOptions } = state;

  if (!courseOptions || courseOptions.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl" aria-hidden="true">🤔</div>
        <p className="text-gray-500">코스를 먼저 만들어보세요</p>
        <button onClick={() => setView('home')} className="btn-primary">
          코스 만들러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <button
        onClick={() => setView('home')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-lg px-1"
        aria-label="조건 설정으로 돌아가기"
      >
        ← 조건 다시 설정
      </button>

      <section className="text-center space-y-1">
        {courseOptions[0]?.preferences.date && (
          <span className="inline-block px-3 py-1 mb-1 text-xs font-semibold text-primary-700 bg-primary-50 rounded-full">
            📅 {formatDateLabel(courseOptions[0].preferences.date)}
          </span>
        )}
        <h2 className="text-xl font-bold text-navy">코스 {courseOptions.length}개를 준비했어요!</h2>
        <p className="text-sm text-gray-500">마음에 드는 코스를 골라주세요</p>
      </section>

      <div className="space-y-4">
        {courseOptions.map((course, i) => (
          <OptionCard key={course.id} course={course} index={i} onSelect={() => setCourse(course)} />
        ))}
      </div>
    </div>
  );
}
