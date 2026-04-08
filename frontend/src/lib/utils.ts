import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 1. Tailwind CSS 클래스 합치기 유틸리티
 * 조건부 클래스 할당(clsx)과 클래스 중복 제거(twMerge)를 동시에 처리합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 2. 날짜 포맷팅 유틸리티
 * @param dateInput - string 또는 Date 객체
 * @returns 'yyyy-MM-dd HH:mm:ss (요일)' 형태의 문자열
 */
export function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return "-"; // 데이터가 없을 경우 처리

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  // 유효하지 않은 날짜인 경우 처리
  if (isNaN(date.getTime())) return "Invalid Date";

  const pad = (n: number) => n.toString().padStart(2, "0");
  
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  const week = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeek = week[date.getDay()];

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} (${dayOfWeek})`;
}