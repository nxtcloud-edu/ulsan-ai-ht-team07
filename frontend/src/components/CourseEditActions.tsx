import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Course } from '../types';
import {
  modifyCourse,
  reduceBudgetCourse,
  reduceDistanceCourse,
  makeIndoorCourse,
  removeCategoryFromCourse,
  regenerateCourse,
} from '../services/recommendation-engine';
import { getAIService } from '../services/ai-service';

interface CourseEditActionsProps {
  course: Course;
}

const editButtons = [
  { label: '이대로 갈래', emoji: '✅', action: 'keep' },
  { label: '밥집만 바꿔줘', emoji: '🍽️', action: 'change_restaurant' },
  { label: '활동만 바꿔줘', emoji: '🎳', action: 'change_activity' },
  { label: '카페 빼줘', emoji: '☕', action: 'remove_cafe' },
  { label: '이동거리 줄여줘', emoji: '📍', action: 'reduce_distance' },
  { label: '예산 줄여줘', emoji: '💰', action: 'reduce_budget' },
  { label: '실내 코스로 바꿔줘', emoji: '🏠', action: 'indoor_only' },
  { label: '전부 다시 짜줘', emoji: '🔄', action: 'regenerate' },
];

export default function CourseEditActions({ course }: CourseEditActionsProps) {
  const { setCourse, setError, saveCourse, setView } = useApp();
  const [customInput, setCustomInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async (action: string) => {
    if (action === 'keep') {
      saveCourse(course);
      return;
    }

    setIsEditing(true);

    // 약간의 딜레이로 UX 개선
    await new Promise((resolve) => setTimeout(resolve, 400));

    let result;

    switch (action) {
      case 'change_restaurant': {
        const restaurantStop = course.stops.find((s) => s.place.category === 'restaurant');
        if (restaurantStop) {
          result = modifyCourse(course, restaurantStop.id);
        }
        break;
      }
      case 'change_activity': {
        const activityStop = course.stops.find((s) =>
          ['bowling', 'escape_room', 'board_game', 'karaoke', 'craft_workshop'].includes(s.place.category)
        );
        if (activityStop) {
          result = modifyCourse(course, activityStop.id);
        }
        break;
      }
      case 'remove_cafe':
        result = removeCategoryFromCourse(course, 'cafe');
        break;
      case 'reduce_distance':
        result = reduceDistanceCourse(course);
        break;
      case 'reduce_budget':
        result = reduceBudgetCourse(course);
        break;
      case 'indoor_only':
        result = makeIndoorCourse(course);
        break;
      case 'regenerate':
        result = regenerateCourse(course.preferences);
        break;
    }

    if (result?.success && result.course) {
      setCourse(result.course);
    } else if (result?.error) {
      setError(result.error);
    }

    setIsEditing(false);
  };

  const handleCustomEdit = async () => {
    if (!customInput.trim()) return;
    setIsEditing(true);

    const aiService = getAIService();
    const parsed = await aiService.parseEditRequest(customInput);

    let result;
    switch (parsed.editType) {
      case 'change_restaurant':
        await handleEdit('change_restaurant');
        setCustomInput('');
        setIsEditing(false);
        return;
      case 'change_activity':
        await handleEdit('change_activity');
        setCustomInput('');
        setIsEditing(false);
        return;
      case 'remove_cafe':
        result = removeCategoryFromCourse(course, 'cafe');
        break;
      case 'reduce_distance':
        result = reduceDistanceCourse(course);
        break;
      case 'reduce_budget':
        result = reduceBudgetCourse(course);
        break;
      case 'indoor_only':
        result = makeIndoorCourse(course);
        break;
      default:
        result = regenerateCourse(course.preferences);
        break;
    }

    if (result?.success && result.course) {
      setCourse(result.course);
    } else if (result?.error) {
      setError(result.error);
    }

    setCustomInput('');
    setIsEditing(false);
  };

  const handleShare = async () => {
    const shareText = course.stops
      .map((s) => `${s.startTime} ${s.place.name}`)
      .join('\n');
    const fullText = `📍 일단나와 코스 추천\n\n${shareText}\n\n💰 1인 ${course.totalCostPerPerson.toLocaleString()}원`;

    if (navigator.share) {
      try {
        await navigator.share({ title: '일단나와 코스', text: fullText });
      } catch {
        // 공유 취소
      }
    } else {
      await navigator.clipboard.writeText(fullText);
      alert('코스 정보가 클립보드에 복사되었어요!');
    }
  };

  return (
    <div className="space-y-4">
      {/* 수정 버튼 */}
      <div className="grid grid-cols-2 gap-2">
        {editButtons.map(({ label, emoji, action }) => (
          <button
            key={action}
            onClick={() => handleEdit(action)}
            disabled={isEditing}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border-2 text-sm font-medium transition-all
              ${action === 'keep'
                ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-gray-200 bg-white text-charcoal hover:border-primary-200 hover:bg-primary-50'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1`}
          >
            <span aria-hidden="true">{emoji}</span>
            <span className="text-left">{label}</span>
          </button>
        ))}
      </div>

      {/* 자연어 수정 입력 */}
      <div className="space-y-2">
        <label htmlFor="custom-edit" className="text-sm font-medium text-gray-600">
          또는 직접 수정 요청하기
        </label>
        <div className="flex gap-2">
          <input
            id="custom-edit"
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomEdit()}
            placeholder="예: 볼링 말고 소품샵 추가해줘"
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-2xl text-sm
              focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200
              placeholder:text-gray-400"
            disabled={isEditing}
          />
          <button
            onClick={handleCustomEdit}
            disabled={isEditing || !customInput.trim()}
            className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
          >
            수정
          </button>
        </div>
      </div>

      {/* 저장/공유 */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => {
            saveCourse(course);
            setView('saved');
          }}
          className="flex-1 btn-secondary flex items-center justify-center gap-2"
        >
          <span aria-hidden="true">💾</span> 코스 저장
        </button>
        <button
          onClick={handleShare}
          className="flex-1 btn-secondary flex items-center justify-center gap-2"
        >
          <span aria-hidden="true">📤</span> 공유하기
        </button>
      </div>
    </div>
  );
}
