import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스 합치기 유틸리티
 * 조건부 클래스 할당(clsx)과 클래스 중복 제거(twMerge)를 동시에 처리합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 날짜 포맷팅 유틸리티
 * @param dateInput - string 또는 Date 객체 ('yyyy-mm-dd', 'yyyymmdd', ISO 문자열 등)
 * @param time_display - true이면 시간(HH:mm:ss) 포함, 기본값 false
 * @param dayofweek - true이면 요일 포함, 기본값 false
 * @param short - true이면 단축 요일 (토 / Sat), 기본값 false. dayofweek=true일 때만 유효
 * @param english - true이면 영어 요일, 기본값 false. dayofweek=true일 때만 유효
 * @returns 포맷팅된 날짜 문자열 (예: '2026-04-11 14:30:00 (토요일)')
 */
export function formatDate(
  dateInput: string | Date | undefined,
  time_display = false,
  dayofweek = false,
  short = false,
  english = false,
): string {
  if (!dateInput) return "-";

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) return "Invalid Date : " + dateInput;

  const pad = (n: number) => n.toString().padStart(2, "0");

  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());

  let result = `${yyyy}-${mm}-${dd}`;

  if (time_display) {
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    result += ` ${hh}:${min}:${ss}`;
  }

  if (dayofweek) {
    result += ` (${getDayOfWeek(`${yyyy}-${mm}-${dd}`, short, english)})`;
  }

  return result;
}

/**
 * 날짜 문자열에서 요일을 반환합니다.
 * @param dateStr - 'yyyy-mm-dd' 또는 'yyyymmdd' 형식
 * @param short - true이면 단축 요일 (토 / Sat), false이면 전체 (토요일 / Saturday)
 * @param english - true이면 영어, false이면 한국어
 */
export const getDayOfWeek = (dateStr: string, short = false, english = false) => {
  try {
    // yyyymmdd → yyyy-mm-dd 정규화
    const normalized = dateStr.length === 8
      ? `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      : dateStr
    const d = new Date(normalized)
    return d.toLocaleDateString(english ? 'en-US' : 'ko-KR', {
      weekday: short ? 'short' : 'long',
    })
  } catch (e) {
    console.error('Invalid date format', e)
    return ''
  }
}