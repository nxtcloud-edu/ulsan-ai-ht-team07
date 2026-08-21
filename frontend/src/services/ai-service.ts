/**
 * AI 서비스 레이어
 * 
 * AI API 키가 있으면 자연어 처리 및 추천 이유 생성에 AI를 활용하고,
 * 없으면 규칙 기반 분석과 미리 정의된 템플릿을 사용합니다.
 * 
 * 인터페이스를 분리하여 나중에 다른 AI 제공자로 교체 가능하게 합니다.
 */

import {
  UserPreferences,
  CompanionType,
  DesiredActivity,
  AvoidCondition,
  CourseEditType,
} from '../types';

// ===== AI 서비스 인터페이스 =====

export interface AIService {
  /** 자연어 요구사항을 구조화된 조건으로 분석 */
  parseNaturalLanguage(input: string): Promise<Partial<UserPreferences>>;

  /** 추천 이유 생성 */
  generateRecommendReason(context: ReasonContext): Promise<string>;

  /** 자연어 수정 요청 분석 */
  parseEditRequest(input: string): Promise<ParsedEditRequest>;

  /** AI 사용 가능 여부 */
  isAvailable(): boolean;
}

export interface ReasonContext {
  placeName: string;
  category: string;
  companion: CompanionType;
  groupSize: number;
  budget: number | null;
}

export interface ParsedEditRequest {
  editType: CourseEditType;
  targetCategory?: string;
  customDetail?: string;
}

// ===== 규칙 기반 Fallback 서비스 =====

class RuleBasedAIService implements AIService {
  isAvailable(): boolean {
    return true; // 항상 사용 가능
  }

  async parseNaturalLanguage(input: string): Promise<Partial<UserPreferences>> {
    const result: Partial<UserPreferences> = {};

    // 동행자 감지
    if (input.includes('혼자') || input.includes('나 혼자')) {
      result.companion = 'solo';
    } else if (input.includes('연인') || input.includes('여자친구') || input.includes('남자친구') || input.includes('데이트')) {
      result.companion = 'couple';
    } else if (input.includes('친구')) {
      result.companion = 'friend';
    } else if (input.includes('부모') || input.includes('엄마') || input.includes('아빠') || input.includes('어머니')) {
      result.companion = 'parent';
    } else if (input.includes('동료') || input.includes('회사') || input.includes('직장')) {
      result.companion = 'coworker';
    }

    // 인원 감지
    const numMatch = input.match(/(\d+)\s*명/);
    if (numMatch) {
      result.groupSize = parseInt(numMatch[1]);
    }

    // 지역 감지 (자주 언급되는 울산 동네만 좌표까지 인식, 그 외는 사용자가 직접 검색)
    if (input.includes('울산대') || input.includes('무거동') || input.includes('울대')) {
      result.location = '울산 남구 무거동';
      result.locationCoords = { latitude: 35.5425, longitude: 129.2564 };
    } else if (input.includes('삼산')) {
      result.location = '울산 남구 삼산동';
      result.locationCoords = { latitude: 35.5387, longitude: 129.3365 };
    } else if (input.includes('성남')) {
      result.location = '울산 중구 성남동';
      result.locationCoords = { latitude: 35.5544, longitude: 129.3156 };
    }

    // 예산 감지
    const budgetMatch = input.match(/(\d+)\s*만\s*원/);
    if (budgetMatch) {
      result.budgetPerPerson = parseInt(budgetMatch[1]) * 10000;
    }

    // 활동 감지
    const activities: DesiredActivity[] = [];
    if (input.includes('밥') || input.includes('식사') || input.includes('먹')) activities.push('먹기');
    if (input.includes('카페') || input.includes('디저트')) activities.push('카페');
    if (input.includes('볼링') || input.includes('활동')) activities.push('활동적인 체험');
    if (input.includes('소품') || input.includes('쇼핑')) activities.push('소품샵');
    if (input.includes('사진') || input.includes('셀프사진')) activities.push('사진');
    if (input.includes('산책') || input.includes('걷')) activities.push('산책');
    if (input.includes('전시') || input.includes('문화') || input.includes('공방')) activities.push('문화생활');
    if (input.includes('술') || input.includes('맥주')) activities.push('술');
    if (activities.length > 0) result.desiredActivities = activities;

    // 피하기 감지
    const avoids: AvoidCondition[] = [];
    if (input.includes('웨이팅') || input.includes('줄') || input.includes('기다리')) avoids.push('긴 웨이팅');
    if (input.includes('야외') && (input.includes('싫') || input.includes('안') || input.includes('빼'))) avoids.push('야외');
    if (input.includes('술') && (input.includes('안') || input.includes('싫') || input.includes('빼'))) avoids.push('술');
    if (input.includes('매운') || input.includes('맵')) avoids.push('매운 음식');
    if (input.includes('걷기') && (input.includes('싫') || input.includes('귀찮') || input.includes('힘'))) avoids.push('많이 걷기');
    if (input.includes('시끄러') || input.includes('조용')) avoids.push('시끄러운 장소');
    if (avoids.length > 0) result.avoidConditions = avoids;

    return result;
  }

  async generateRecommendReason(context: ReasonContext): Promise<string> {
    const templates: string[] = [];

    if (context.companion === 'friend') {
      templates.push(`친구 ${context.groupSize}명이 함께 즐길 수 있는 장소예요.`);
    } else if (context.companion === 'couple') {
      templates.push('연인과 함께하기 좋은 분위기예요.');
    } else if (context.companion === 'parent') {
      templates.push('부모님과 편하게 방문할 수 있는 곳이에요.');
    }

    if (context.budget && context.budget <= 10000) {
      templates.push('가격이 부담스럽지 않아요.');
    }

    return templates[0] || '오늘 코스에 어울리는 장소예요.';
  }

  async parseEditRequest(input: string): Promise<ParsedEditRequest> {
    // 수정 요청 패턴 매칭
    if (input.includes('밥') || input.includes('식당') || input.includes('음식점')) {
      return { editType: 'change_restaurant' };
    }
    if (input.includes('활동') || input.includes('놀거리') || input.includes('체험')) {
      return { editType: 'change_activity' };
    }
    if (input.includes('카페') && (input.includes('빼') || input.includes('제거'))) {
      return { editType: 'remove_cafe' };
    }
    if (input.includes('거리') || input.includes('가까') || input.includes('걷')) {
      return { editType: 'reduce_distance' };
    }
    if (input.includes('돈') || input.includes('예산') || input.includes('비용') || input.includes('저렴')) {
      return { editType: 'reduce_budget' };
    }
    if (input.includes('실내') || input.includes('비') || input.includes('야외')) {
      return { editType: 'indoor_only' };
    }

    return { editType: 'custom', customDetail: input };
  }
}

// ===== AI API 기반 서비스 (확장용) =====

class ExternalAIService implements AIService {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiUrl);
  }

  async parseNaturalLanguage(input: string): Promise<Partial<UserPreferences>> {
    // 실제 AI API 호출 구현 위치
    // MVP에서는 규칙 기반으로 fallback
    const fallback = new RuleBasedAIService();
    return fallback.parseNaturalLanguage(input);
  }

  async generateRecommendReason(context: ReasonContext): Promise<string> {
    const fallback = new RuleBasedAIService();
    return fallback.generateRecommendReason(context);
  }

  async parseEditRequest(input: string): Promise<ParsedEditRequest> {
    const fallback = new RuleBasedAIService();
    return fallback.parseEditRequest(input);
  }
}

// ===== 서비스 인스턴스 생성 =====

let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (aiServiceInstance) return aiServiceInstance;

  const apiKey = import.meta.env.VITE_AI_API_KEY;
  const apiUrl = import.meta.env.VITE_AI_API_URL;

  if (apiKey && apiUrl) {
    aiServiceInstance = new ExternalAIService(apiKey, apiUrl);
  } else {
    aiServiceInstance = new RuleBasedAIService();
  }

  return aiServiceInstance;
}
