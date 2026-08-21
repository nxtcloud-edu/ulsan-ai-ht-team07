import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import HomeView from './components/HomeView';
import CourseOptionsView from './components/CourseOptionsView';
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

        {/* 기존 폼 모드: 조건 설정 → 결과 순서로 한 화면씩만 표시 */}
        {currentView !== 'chat' && (
          <div className="px-4 py-6 lg:px-8 max-w-2xl mx-auto">
            {currentView === 'home' && <HomeView />}
            {currentView === 'options' && <CourseOptionsView />}
            {currentView === 'result' && <ResultView />}
            {currentView === 'saved' && <SavedCourseList />}
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
