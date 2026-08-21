import { useApp } from '../context/AppContext';
import CourseTimeline from './CourseTimeline';
import CourseEditActions from './CourseEditActions';
import ErrorView from './ErrorView';
import { shareCourseAsFeed, isKakaoShareReady } from '../services/kakao-share-service';

export default function ResultView() {
  const { state, setView, saveCourse } = useApp();
  const { currentCourse, error } = state;

  if (error) {
    return <ErrorView error={error} />;
  }

  if (!currentCourse) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl" aria-hidden="true">🤔</div>
        <p className="text-gray-500">코스를 먼저 만들어보세요</p>
        <button
          onClick={() => setView('home')}
          className="btn-primary"
        >
          코스 만들러 가기
        </button>
      </div>
    );
  }

  const handleKakaoShare = () => {
    if (!isKakaoShareReady()) {
      alert('카카오톡 공유 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const success = shareCourseAsFeed(currentCourse);
    if (!success) {
      alert('카카오톡 공유에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 뒤로가기 */}
      <button
        onClick={() => setView('home')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-lg px-1"
        aria-label="조건 설정으로 돌아가기"
      >
        ← 조건 다시 설정
      </button>

      {/* 코스 타임라인 */}
      <CourseTimeline course={currentCourse} />

      {/* 코스 수정 액션 */}
      <CourseEditActions course={currentCourse} />

      {/* 공유 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={handleKakaoShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FEE500] text-[#191919] font-semibold
            rounded-2xl hover:bg-[#F5DC00] active:scale-[0.98] transition-all
            focus:outline-none focus:ring-2 focus:ring-yellow-400"
          aria-label="카카오톡으로 코스 공유하기"
        >
          💬 카톡으로 공유
        </button>
        <button
          onClick={() => saveCourse(currentCourse)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-100 text-primary-700 font-semibold
            rounded-2xl hover:bg-primary-200 active:scale-[0.98] transition-all
            focus:outline-none focus:ring-2 focus:ring-primary-300"
          aria-label="코스 저장하기"
        >
          💾 코스 저장
        </button>
      </div>
    </div>
  );
}
