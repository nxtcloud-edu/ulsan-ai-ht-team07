import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import HomeView from './components/HomeView';
import ResultView from './components/ResultView';
import SavedCourseList from './components/SavedCourseList';
import ChatView from './components/ChatView';
import LoadingOverlay from './components/LoadingOverlay';

function AppContent() {
  const { state } = useApp();
  const { currentView, isLoading } = state;

  return (
    <div className="min-h-screen bg-ivory">
      <Header />

      {isLoading && <LoadingOverlay />}

      <main className="max-w-screen-xl mx-auto">
        {/* 챗봇 모드 */}
        {currentView === 'chat' && (
          <div className="max-w-lg mx-auto">
            <ChatView />
          </div>
        )}

        {/* 기존 폼 모드 */}
        {currentView !== 'chat' && (
          <div className="lg:flex lg:gap-8 lg:px-8 lg:py-6">
            {/* 모바일: 단일 열 / 데스크톱: 왼쪽 입력 */}
            <div
              className={`px-4 py-6 lg:px-0 lg:py-0 lg:flex-1 lg:max-w-md
                ${currentView === 'result' ? 'hidden lg:block' : ''}
                ${currentView === 'saved' ? 'hidden lg:hidden' : ''}`}
            >
              <HomeView />
            </div>

            {/* 모바일: 결과 뷰 / 데스크톱: 오른쪽 결과 */}
            <div
              className={`px-4 py-6 lg:px-0 lg:py-0 lg:flex-1
                ${currentView === 'home' ? 'hidden lg:block' : ''}
                ${currentView === 'saved' ? 'hidden' : ''}`}
            >
              <ResultView />
            </div>

            {/* 저장 코스 화면 */}
            {currentView === 'saved' && (
              <div className="px-4 py-6 lg:px-0 lg:py-0 w-full max-w-2xl mx-auto">
                <SavedCourseList />
              </div>
            )}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100">
        <p>일단나와 MVP · 울산 지역 여가 코스 추천 서비스</p>
        <p className="mt-1">샘플 데이터 기반 시연 버전</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
