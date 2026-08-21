/**
 * 시간 관련 유틸리티 함수
 */

/** "HH:mm" 형식 시간을 분 단위로 변환 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** 분 단위를 "HH:mm" 형식으로 변환 */
export function minutesToTime(minutes: number): string {
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalizedMinutes / 60);
  const m = normalizedMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** 현재 시간을 "HH:mm" 형식으로 반환 */
export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

/** 현재 요일 반환 (0=일, 1=월, ..., 6=토) */
export function getCurrentDayOfWeek(): number {
  return new Date().getDay();
}

/** 요일 숫자를 영문 키로 변환 */
export function dayToKey(day: number): string {
  const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return keys[day];
}

/** 시작-종료 시간 사이의 총 가용 시간 (분) */
export function getAvailableMinutes(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  // 자정을 넘기는 경우
  if (end <= start) {
    end += 1440;
  }
  return end - start;
}

/** 특정 시간에 장소가 영업 중인지 확인 */
export function isOpenAt(
  openingHours: Record<string, { open: string; close: string }>,
  dayOfWeek: number,
  time: string
): boolean {
  const dayKey = dayToKey(dayOfWeek);
  const hours = openingHours[dayKey];
  if (!hours) return false;

  const timeMin = timeToMinutes(time);
  const openMin = timeToMinutes(hours.open);
  let closeMin = timeToMinutes(hours.close);

  // 자정을 넘기는 영업시간 처리
  if (closeMin <= openMin) {
    closeMin += 1440;
    return timeMin >= openMin || timeMin + 1440 <= closeMin;
  }

  return timeMin >= openMin && timeMin <= closeMin;
}

/** 장소 방문 시작~종료 시간이 영업시간 내에 있는지 확인 */
export function canVisitDuring(
  openingHours: Record<string, { open: string; close: string }>,
  dayOfWeek: number,
  visitStart: string,
  durationMinutes: number
): boolean {
  const dayKey = dayToKey(dayOfWeek);
  const hours = openingHours[dayKey];
  if (!hours) return false;

  const visitStartMin = timeToMinutes(visitStart);
  const visitEndMin = visitStartMin + durationMinutes;
  const openMin = timeToMinutes(hours.open);
  let closeMin = timeToMinutes(hours.close);

  // 자정을 넘기는 경우
  if (closeMin <= openMin) {
    closeMin += 1440;
  }

  return visitStartMin >= openMin && visitEndMin <= closeMin;
}

/** 두 시간 사이의 차이 (분) */
export function timeDifference(time1: string, time2: string): number {
  return Math.abs(timeToMinutes(time1) - timeToMinutes(time2));
}

/** "HH:mm"에 분을 더한 시간 반환 */
export function addMinutes(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes;
  return minutesToTime(totalMinutes);
}
