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
  dayofweek = true,
  short = true,
  english = false,
  time_display = false,
): string {
  if (!dateInput) return "-";

  const normalized =
    typeof dateInput === "string" && dateInput.length === 8
      ? `${dateInput.slice(0, 4)}-${dateInput.slice(4, 6)}-${dateInput.slice(6, 8)}`
      : dateInput;
  const date = typeof normalized === "string" ? new Date(normalized) : normalized;

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

/**
 * Date 또는 날짜 문자열을 yyyymmdd 형식으로 변환합니다.
 * @param input - Date 객체, 'yyyy-mm-dd', 또는 'yyyymmdd' 형식의 문자열
 * @returns 'yyyymmdd' 형식의 날짜 문자열 (예: '20260412')
 */
export const formatYmd = (input: Date | string): string => {
  if (input instanceof Date) {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${input.getFullYear()}${pad(input.getMonth() + 1)}${pad(input.getDate())}`
  }
  // 숫자가 아닌 문자 제거 → yyyymmdd
  return input.replace(/\D/g, '')
}

/**
 * 파일 크기를 사람이 읽기 쉬운 문자열로 변환합니다.
 * @param bytes - 바이트 단위의 파일 크기
 * @returns 포맷팅된 파일 크기 문자열 (예: '1.5 MB', '320.0 KB')
 */
export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}