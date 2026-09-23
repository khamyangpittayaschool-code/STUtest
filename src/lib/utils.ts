import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number | string | undefined | null): string {
  if (points === undefined || points === null) return '0';
  const num = typeof points === 'string' ? parseFloat(points) : points;
  if (isNaN(num)) return '0';
  return num % 1 === 0 ? num.toLocaleString('th-TH') : num.toLocaleString('th-TH', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export function formatThaiDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' น.';
  } catch {
    return String(dateString);
  }
}

export function getBangkokNowString(): string {
  try {
    const date = new Date();
    return date.toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' น.';
  } catch {
    return new Date().toLocaleString();
  }
}

export const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRandomCode(length = 5, charset = CODE_CHARSET): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}
