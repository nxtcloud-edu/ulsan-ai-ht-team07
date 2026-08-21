import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import {
  AppState,
  AppView,
  UserPreferences,
  Course,
  RecommendationError,
} from '../types';
import { enrichCourseWithExternalData } from '../services/external-data-service';

// ===== 기본값 =====

const defaultPreferences: UserPreferences = {
  companion: 'friend',
  location: 'ulsan_univ',
  groupSize: 2,
  startTime: 'now',
  endTime: undefined,
  budgetPerPerson: 30000,
  transport: 'any',
  desiredActivities: [],
  avoidConditions: [],
  additionalRequest: '',
};

const initialState: AppState = {
  currentView: 'home',
  preferences: defaultPreferences,
  currentCourse: null,
  savedCourses: [],
  isLoading: false,
  error: null,
};

// ===== 액션 타입 =====

type AppAction =
  | { type: 'SET_VIEW'; payload: AppView }
  | { type: 'SET_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_PREFERENCES' }
  | { type: 'SET_COURSE'; payload: Course }
  | { type: 'CLEAR_COURSE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: RecommendationError | null }
  | { type: 'SAVE_COURSE'; payload: Course }
  | { type: 'DELETE_SAVED_COURSE'; payload: string }
  | { type: 'LOAD_SAVED_COURSES'; payload: Course[] };

// ===== 리듀서 =====

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload, error: null };

    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    case 'RESET_PREFERENCES':
      return { ...state, preferences: defaultPreferences };

    case 'SET_COURSE':
      return { ...state, currentCourse: action.payload, isLoading: false, error: null };

    case 'CLEAR_COURSE':
      return { ...state, currentCourse: null };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SAVE_COURSE': {
      const courseToSave = {
        ...action.payload,
        savedAt: new Date().toISOString(),
      };
      const exists = state.savedCourses.some((c) => c.id === courseToSave.id);
      const updatedSaved = exists
        ? state.savedCourses.map((c) => (c.id === courseToSave.id ? courseToSave : c))
        : [courseToSave, ...state.savedCourses];
      return { ...state, savedCourses: updatedSaved };
    }

    case 'DELETE_SAVED_COURSE':
      return {
        ...state,
        savedCourses: state.savedCourses.filter((c) => c.id !== action.payload),
      };

    case 'LOAD_SAVED_COURSES':
      return { ...state, savedCourses: action.payload };

    default:
      return state;
  }
}

// ===== Context =====

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // 편의 함수
  setView: (view: AppView) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  setCourse: (course: Course) => void;
  clearCourse: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: RecommendationError | null) => void;
  saveCourse: (course: Course) => void;
  deleteSavedCourse: (id: string) => void;
  loadSavedCourse: (course: Course) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ===== localStorage 키 =====

const STORAGE_KEY_COURSES = 'ildan-nawa-saved-courses';
const STORAGE_KEY_PREFS = 'ildan-nawa-last-prefs';

// ===== Provider =====

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 저장된 코스 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURSES);
      if (saved) {
        const courses: Course[] = JSON.parse(saved);
        dispatch({ type: 'LOAD_SAVED_COURSES', payload: courses });
      }
    } catch {
      // 손상된 데이터 무시
      localStorage.removeItem(STORAGE_KEY_COURSES);
    }

    // 마지막 선호도 복원
    try {
      const savedPrefs = localStorage.getItem(STORAGE_KEY_PREFS);
      if (savedPrefs) {
        const prefs: Partial<UserPreferences> = JSON.parse(savedPrefs);
        dispatch({ type: 'SET_PREFERENCES', payload: prefs });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY_PREFS);
    }
  }, []);

  // 저장 코스 변경 시 localStorage 동기화
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(state.savedCourses));
    } catch {
      // storage full 등 에러 무시
    }
  }, [state.savedCourses]);

  // 선호도 변경 시 localStorage 동기화
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(state.preferences));
    } catch {
      // 무시
    }
  }, [state.preferences]);

  // 편의 함수
  const setView = (view: AppView) => dispatch({ type: 'SET_VIEW', payload: view });
  const updatePreferences = (prefs: Partial<UserPreferences>) =>
    dispatch({ type: 'SET_PREFERENCES', payload: prefs });
  const resetPreferences = () => dispatch({ type: 'RESET_PREFERENCES' });
  const setCourse = useCallback((course: Course) => {
    dispatch({ type: 'SET_COURSE', payload: course });
    setView('result');

    // 코스 설정 후 외부 데이터를 비동기로 채움
    enrichCourseWithExternalData(course).then((enrichedCourse) => {
      dispatch({ type: 'SET_COURSE', payload: enrichedCourse });
    }).catch((err) => {
      console.warn('[AppContext] 외부 데이터 로드 실패 (코스는 정상 표시됨):', err);
    });
  }, []);
  const clearCourse = () => dispatch({ type: 'CLEAR_COURSE' });
  const setLoading = (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading });
  const setError = (error: RecommendationError | null) =>
    dispatch({ type: 'SET_ERROR', payload: error });
  const saveCourse = (course: Course) => dispatch({ type: 'SAVE_COURSE', payload: course });
  const deleteSavedCourse = (id: string) =>
    dispatch({ type: 'DELETE_SAVED_COURSE', payload: id });
  const loadSavedCourse = (course: Course) => {
    dispatch({ type: 'SET_COURSE', payload: course });
    dispatch({ type: 'SET_PREFERENCES', payload: course.preferences });
    setView('result');
  };

  const value: AppContextValue = {
    state,
    dispatch,
    setView,
    updatePreferences,
    resetPreferences,
    setCourse,
    clearCourse,
    setLoading,
    setError,
    saveCourse,
    deleteSavedCourse,
    loadSavedCourse,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ===== Hook =====

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export { defaultPreferences };
