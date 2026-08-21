import { Course } from '../types';
import { formatCost } from '../utils/cost';
import { formatTravelTime } from '../utils/distance';

interface CourseSummaryProps {
  course: Course;
}

export default function CourseSummary({ course }: CourseSummaryProps) {
  const indoorPercent = Math.round(course.indoorRatio * 100);

  const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}분`;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  };

  return (
    <div className="card bg-gradient-to-br from-primary-50 to-white space-y-3" aria-label="코스 요약 정보">
      <h3 className="text-sm font-semibold text-primary-700">코스 요약</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-500">1인당 예상 비용</p>
          <p className="text-lg font-bold text-navy">{formatCost(course.totalCostPerPerson)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-gray-500">전체 이동시간</p>
          <p className="text-lg font-bold text-navy">{formatTravelTime(course.totalTravelTime)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-gray-500">총 소요시간</p>
          <p className="text-lg font-bold text-navy">{formatDuration(course.totalDuration)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-gray-500">실내 비율</p>
          <p className="text-lg font-bold text-navy">{indoorPercent}%</p>
        </div>
      </div>
    </div>
  );
}
