import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parse, parseISO, isValid } from "date-fns";
import { ko, enUS } from "date-fns/locale";

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

  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (dateInput.length === 8) {
    date = parse(dateInput, "yyyyMMdd", new Date());
  } else {
    date = parseISO(dateInput);
  }

  if (!isValid(date)) return "Invalid Date : " + dateInput;

  let result = format(date, "yyyy-MM-dd");

  if (time_display) {
    result += " " + format(date, "HH:mm:ss");
  }

  if (dayofweek) {
    const pattern = short ? "EEE" : "EEEE";
    const locale = english ? enUS : ko;
    result += ` (${format(date, pattern, { locale })})`;
  }

  return result;
}

/**
 * 날짜 문자열에서 요일을 반환합니다.
 * @param dateStr - 'yyyy-mm-dd' 또는 'yyyymmdd' 형식
 * @param short - true이면 단축 요일 (토 / Sat), false이면 전체 (토요일 / Saturday)
 * @param english - true이면 영어, false이면 한국어
 */
export const getDayOfWeek = (dateStr: string, short = false, english = false): string => {
  try {
    const d = dateStr.length === 8
      ? parse(dateStr, "yyyyMMdd", new Date())
      : parseISO(dateStr);
    if (!isValid(d)) return "";
    const pattern = short ? "EEE" : "EEEE";
    const locale = english ? enUS : ko;
    return format(d, pattern, { locale });
  } catch (e) {
    console.error("Invalid date format", e);
    return "";
  }
}

/**
 * Date 또는 날짜 문자열을 yyyymmdd 형식으로 변환합니다.
 * @param input - Date 객체, 'yyyy-mm-dd', 또는 'yyyymmdd' 형식의 문자열
 * @returns 'yyyymmdd' 형식의 날짜 문자열 (예: '20260412')
 */
export const formatYmd = (input: Date | string): string => {
  if (input instanceof Date) {
    return format(input, "yyyyMMdd");
  }
  return input.replace(/\D/g, "");
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

/**
 * 천단위로 콤마를 추가하여 숫자를 포맷팅합니다.
 * @param count 숫자(number) 또는 undefined
 * @param defaultValue count가 undefined일 때 반환할 기본값
 * @returns 포맷팅된 숫자 문자열 또는 기본값
 */
export function formatCount(count: number | undefined, defaultValue = '-'): string {
  if (count === undefined || count === null) return defaultValue
  return count.toLocaleString('en-US')
}
/**
 * 비용(cost) 숫자를 천단위로 콤마를 추가하여 포맷팅합니다.
 * @param cost 숫자(number) 또는 undefined
 * @param defaultValue cost가 undefined일 때 반환할 기본값 (기본값은 '0')
 * @returns 포맷팅된 비용 문자열 또는 기본값
 */
export function formatCost(cost: number | undefined, defaultValue = '0'): string {
  if (cost === undefined || cost === null) return defaultValue
  return cost.toLocaleString('en-US')
} 