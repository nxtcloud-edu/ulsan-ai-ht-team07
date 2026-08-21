import { Course } from '../types';
import PlaceCard from './PlaceCard';
import CourseSummary from './CourseSummary';

interface CourseTimelineProps {
  course: Course;
}

export default function CourseTimeline({ course }: CourseTimelineProps) {
  return (
    <div className="space-y-4">
      {/* 제목 */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-navy">오늘은 이렇게 놀아보세요!</h2>
        <p className="text-sm text-gray-500">
          {course.stops.length}곳을 돌아보는 코스예요
        </p>
      </div>

      {/* 요약 */}
      <CourseSummary course={course} />

      {/* 타임라인 */}
      <div className="relative space-y-3">
        {/* 타임라인 선 */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-primary-200" aria-hidden="true" />

        {course.stops.map((stop, index) => (
          <div key={stop.id} className="relative pl-14">
            {/* 타임라인 점 */}
            <div
              className="absolute left-4 top-6 w-5 h-5 bg-primary-500 rounded-full border-4 border-primary-100 z-10"
              aria-hidden="true"
            />
            <PlaceCard
              stop={stop}
              isFirst={index === 0}
              startPlaceName={course.preferences.startPlaceName}
              startCoords={course.preferences.startCoords}
              transport={course.preferences.transport}
            />
          </div>
        ))}

        {/* 종료 점 */}
        <div className="relative pl-14">
          <div
            className="absolute left-4 top-2 w-5 h-5 bg-success rounded-full border-4 border-green-100 z-10"
            aria-hidden="true"
          />
          <div className="text-sm text-gray-500 font-medium pt-1">
            🎉 코스 끝! ({course.stops[course.stops.length - 1]?.endTime})
          </div>
        </div>
      </div>
    </div>
  );
}
