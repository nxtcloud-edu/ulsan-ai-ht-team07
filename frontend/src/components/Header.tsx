import { useApp } from '../context/AppContext';

export default function Header() {
  const { state, setView } = useApp();

  return (
    <header className="sticky top-0 z-50 bg-ivory/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-lg px-1"
          aria-label="홈으로 이동"
        >
          <span className="text-xl font-bold text-primary-600">일단나와</span>
        </button>

        <nav className="flex items-center gap-1.5" aria-label="메인 네비게이션">
          <button
            onClick={() => setView('chat')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors
              ${state.currentView === 'chat' ? 'bg-primary-100 text-primary-700' : 'text-charcoal hover:bg-gray-100'}`}
            aria-current={state.currentView === 'chat' ? 'page' : undefined}
          >
            💬 대화
          </button>
          <button
            onClick={() => setView('home')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors
              ${state.currentView === 'home' || state.currentView === 'result' ? 'bg-primary-100 text-primary-700' : 'text-charcoal hover:bg-gray-100'}`}
            aria-current={state.currentView === 'home' ? 'page' : undefined}
          >
            🎛️ 선택
          </button>
          <button
            onClick={() => setView('saved')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors relative
              ${state.currentView === 'saved' ? 'bg-primary-100 text-primary-700' : 'text-charcoal hover:bg-gray-100'}`}
            aria-current={state.currentView === 'saved' ? 'page' : undefined}
          >
            💾 저장
            {state.savedCourses.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {state.savedCourses.length}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
