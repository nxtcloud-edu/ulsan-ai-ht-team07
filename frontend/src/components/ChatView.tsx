import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getAIService } from '../services/ai-service';
import { generateCourseAsync } from '../services/recommendation-engine';
import { UserPreferences } from '../types';
import { defaultPreferences } from '../context/AppContext';
import CourseTimeline from './CourseTimeline';
import CourseEditActions from './CourseEditActions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  course?: Awaited<ReturnType<typeof generateCourseAsync>>['course'];
}

const GREETING = '안녕하세요! 일단나와예요 👋\n어디서 누구랑 놀고 싶은지 편하게 말해주세요.\n\n예시:\n"친구 3명이랑 울산대 근처에서 오후 5시부터 3만원 이하로 놀 거야"\n"오늘 데이트인데 삼산동에서 뭐 하지?"\n"혼자 성남동에서 시간 보내고 싶어"';

const FOLLOW_UPS = [
  '코스를 수정하고 싶으면 말해주세요! 예: "볼링 빼줘", "예산 줄여줘", "카페 추가해줘"',
];

export default function ChatView() {
  const { setCourse, setView, state } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'greeting', role: 'assistant', content: GREETING },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [currentPrefs, setCurrentPrefs] = useState<UserPreferences>(defaultPreferences);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, course?: Awaited<ReturnType<typeof generateCourseAsync>>['course']) => {
    setMessages((prev) => [...prev, {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      content,
      course,
    }]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    setInput('');
    addMessage('user', text);
    setIsThinking(true);

    // 약간의 딜레이로 자연스럽게
    await new Promise((r) => setTimeout(r, 600));

    const aiService = getAIService();

    // 먼저 수정 요청인지 확인 (이미 코스가 있을 때)
    const lastCourseMsg = [...messages].reverse().find((m) => m.course);
    if (lastCourseMsg?.course) {
      const editResult = await aiService.parseEditRequest(text);
      if (editResult.editType !== 'custom') {
        // 수정 요청으로 처리
        const { modifyCourse, reduceBudgetCourse, reduceDistanceCourse, makeIndoorCourse, regenerateCourse } = await import('../services/recommendation-engine');
        let result;
        const course = lastCourseMsg.course;

        switch (editResult.editType) {
          case 'change_restaurant': {
            const stop = course.stops.find((s) => s.place.category === 'restaurant');
            if (stop) result = modifyCourse(course, stop.id);
            break;
          }
          case 'change_activity': {
            const stop = course.stops.find((s) =>
              ['bowling', 'escape_room', 'board_game', 'karaoke', 'craft_workshop'].includes(s.place.category)
            );
            if (stop) result = modifyCourse(course, stop.id);
            break;
          }
          case 'reduce_budget':
            result = reduceBudgetCourse(course);
            break;
          case 'reduce_distance':
            result = reduceDistanceCourse(course);
            break;
          case 'indoor_only':
            result = makeIndoorCourse(course);
            break;
          default:
            result = regenerateCourse(course.preferences);
            break;
        }

        if (result?.success && result.course) {
          addMessage('assistant', '수정했어요! 이렇게 어때요? 👇', result.course);
          setCourse(result.course);
        } else {
          addMessage('assistant', '조건에 맞는 장소를 못 찾았어요 😅 다른 요청을 해보시겠어요?');
        }
        setIsThinking(false);
        return;
      }
    }

    // 새로운 코스 요청
    const parsed = await aiService.parseNaturalLanguage(text);
    const mergedPrefs: UserPreferences = { ...currentPrefs, ...parsed };

    // 부족한 정보 체크
    if (!parsed.companion && !parsed.location && !parsed.desiredActivities) {
      addMessage('assistant', '좀 더 알려주시면 좋겠어요! 예를 들어:\n• 누구랑 (친구, 연인, 부모님...)\n• 어디서 (울산대, 삼산동, 성남동...)\n• 언제 / 예산\n• 뭐 하고 싶은지\n\n편하게 말해주세요 😊');
      setIsThinking(false);
      return;
    }

    setCurrentPrefs(mergedPrefs);

    // 코스 생성
    const result = await generateCourseAsync(mergedPrefs);

    if (result.success && result.course) {
      const stops = result.course.stops;
      const summary = stops.map((s) => s.place.name).join(' → ');
      addMessage(
        'assistant',
        `코스 짜봤어요! 🎉\n${summary}\n\n${FOLLOW_UPS[0]}`,
        result.course
      );
      setCourse(result.course);
    } else {
      addMessage('assistant', '조건에 맞는 코스를 만들기 어렵네요 😅\n예산을 좀 올리거나, 피하고 싶은 조건을 줄여보시겠어요?');
    }

    setIsThinking(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (text: string) => {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] max-h-[800px]">
      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
              {/* 말풍선 */}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.role === 'user'
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-white border border-gray-100 text-charcoal rounded-bl-md shadow-sm'
                  }`}
              >
                {msg.content}
              </div>

              {/* 코스 결과 (어시스턴트 메시지에 붙음) */}
              {msg.course && (
                <div className="mt-3">
                  <CourseTimeline course={msg.course} />
                  <div className="mt-3">
                    <CourseEditActions course={msg.course} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 타이핑 인디케이터 */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 빠른 입력 칩 */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {['친구 3명이랑 울산대 근처에서 놀래', '오늘 데이트 코스 짜줘', '혼자 카페 가고 싶어', '부모님이랑 점심 먹을 곳'].map((text) => (
            <button
              key={text}
              onClick={() => handleQuickAction(text)}
              className="text-xs px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full border border-primary-200
                hover:bg-primary-100 transition-colors"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {/* 입력 영역 */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-ivory">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="편하게 말해주세요..."
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl text-sm
              focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200
              placeholder:text-gray-400"
            disabled={isThinking}
            aria-label="메시지 입력"
          />
          <button
            onClick={handleSend}
            disabled={isThinking || !input.trim()}
            className="px-4 py-3 bg-primary-500 text-white rounded-2xl font-medium text-sm
              hover:bg-primary-600 active:bg-primary-700 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-primary-300"
            aria-label="전송"
          >
            전송
          </button>
        </div>
        <button
          onClick={() => setView('home')}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 w-full text-center"
        >
          ← 직접 선택하기로 전환
        </button>
      </div>
    </div>
  );
}
