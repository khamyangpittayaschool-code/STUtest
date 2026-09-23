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

export function getEmbedPreviewUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  try {
    // 1. Google Drive file URL: /file/d/{FILE_ID}/view or /edit -> /preview
    const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveFileMatch && driveFileMatch[1]) {
      return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
    }

    // 2. Google Drive open?id={FILE_ID} -> /preview
    const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i);
    if (driveOpenMatch && driveOpenMatch[1]) {
      return `https://drive.google.com/file/d/${driveOpenMatch[1]}/preview`;
    }

    // 3. Google Docs: /document/d/{ID}/edit -> /preview
    const docMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i);
    if (docMatch && docMatch[1]) {
      return `https://docs.google.com/document/d/${docMatch[1]}/preview`;
    }

    // 4. Google Sheets: /spreadsheets/d/{ID}/edit -> /preview
    const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i);
    if (sheetMatch && sheetMatch[1]) {
      return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/preview`;
    }

    // 5. Google Slides: /presentation/d/{ID}/edit -> /embed
    const slideMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/i);
    if (slideMatch && slideMatch[1]) {
      return `https://docs.google.com/presentation/d/${slideMatch[1]}/embed`;
    }

    // 6. Canva design URL: convert to embed view
    if (url.includes('canva.com/design/')) {
      if (!url.includes('embed')) {
        return url.includes('?') ? `${url}&embed` : `${url}?embed`;
      }
    }
  } catch (e) {
    console.error('getEmbedPreviewUrl error:', e);
  }

  return url;
}
