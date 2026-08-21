import { useApp } from '../context/AppContext';
import { Course } from '../types';
import { formatCost } from '../utils/cost';

const companionLabels: Record<string, string> = {
  solo: '혼자',
  couple: '연인',
  friend: '친구',
  parent: '부모님',
  coworker: '직장동료',
};

const locationLabels: Record<string, string> = {
  ulsan_univ: '울산대·무거동',
  samsan: '삼산동',
  seongnam: '성남동',
  ilsan_daewangam: '일산지·대왕암',
  ulju: '울주군',
  custom: '기타',
};

export default function SavedCourseList() {
  const { state, loadSavedCourse, deleteSavedCourse } = useApp();
  const courses = state.savedCourses;

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl" aria-hidden="true">📋</div>
        <h2 className="text-lg font-semibold text-navy">아직 저장한 코스가 없어요</h2>
        <p className="text-sm text-gray-500">
          코스를 추천받고 마음에 들면 저장해보세요!
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${mins}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy">저장한 코스</h2>
        <span className="text-sm text-gray-400">{courses.length}개</span>
      </div>

      <div className="space-y-3">
        {courses.map((course: Course) => (
          <article key={course.id} className="card space-y-3" aria-label={`저장 코스 - ${formatDate(course.savedAt || course.createdAt)}`}>
            {/* 헤더 */}
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy">
                    {companionLabels[course.preferences.companion]}과 {locationLabels[course.preferences.location]}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(course.savedAt || course.createdAt)} 저장
                </p>
              </div>
              <span className="text-sm font-medium text-primary-600">
                {formatCost(course.totalCostPerPerson)}
              </span>
            </div>

            {/* 코스 미리보기 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {course.stops.map((stop, i) => (
                <div key={stop.id} className="flex items-center gap-1 shrink-0">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-700 whitespace-nowrap">
                    {stop.place.name}
                  </span>
                  {i < course.stops.length - 1 && (
                    <span className="text-gray-300 text-xs" aria-hidden="true">→</span>
                  )}
                </div>
              ))}
            </div>

            {/* 요약 정보 */}
            <div className="flex gap-3 text-xs text-gray-500">
              <span>{course.stops.length}곳</span>
              <span>{course.preferences.groupSize}명</span>
              <span>{course.stops[0]?.startTime}~{course.stops[course.stops.length - 1]?.endTime}</span>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => loadSavedCourse(course)}
                className="flex-1 py-2 text-sm text-primary-600 font-medium rounded-xl border border-primary-200
                  hover:bg-primary-50 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                다시 보기
              </button>
              <button
                onClick={() => {
                  if (confirm('이 코스를 삭제할까요?')) {
                    deleteSavedCourse(course.id);
                  }
                }}
                className="py-2 px-4 text-sm text-red-500 font-medium rounded-xl border border-red-200
                  hover:bg-red-50 transition-colors
                  focus:outline-none focus:ring-2 focus:ring-red-200"
                aria-label="코스 삭제"
              >
                삭제
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
