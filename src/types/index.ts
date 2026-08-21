// ===== API 요청/응답 타입 =====

export interface CourseRequest {
  companion: string;
  location: string;
  groupSize: number;
  startTime: string;
  endTime?: string;
  budgetPerPerson: number | null;
  transport: string;
  desiredActivities: string[];
  avoidConditions: string[];
  additionalRequest?: string;
  startPlaceName?: string;
  startCoords?: { latitude: number; longitude: number };
  mustVisitPlaces?: MustVisitPlace[];
}

export interface MustVisitPlace {
  name: string;
  kakaoId?: string;
  latitude?: number;
  longitude?: number;
  placeUrl?: string;
}

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  category: string;
  subCategory?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  placeUrl: string;
  averageCost: number;
  averageDuration: number;
}

export interface CourseStop {
  id: string;
  place: PlaceResult;
  startTime: string;
  endTime: string;
  duration: number;
  estimatedCost: number;
  distanceFromPrev: number;
  travelTimeFromPrev: number;
  recommendReason: string;
  order: number;
}

export interface CourseResponse {
  success: boolean;
  course?: {
    id: string;
    stops: CourseStop[];
    totalCostPerPerson: number;
    totalTravelTime: number;
    createdAt: string;
  };
  error?: string;
}

export interface PlaceSearchRequest {
  query: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  size?: number;
}

export interface PlaceSearchResponse {
  success: boolean;
  places: PlaceResult[];
  total: number;
}
