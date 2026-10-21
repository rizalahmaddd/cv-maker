import type { Cv } from '../types';
import { safeFileName } from './files';
import { todayISO } from './id';

export function cvFileName(cv: Cv, pattern: string, ext: string, prefix = ''): string {
  const name = cv.personal.fullName.trim() || 'Tanpa_Nama';
  const filled = (pattern || 'CV_{nama}')
    .replace(/\{nama\}/gi, name)
    .replace(/\{posisi\}/gi, cv.targetRole.trim())
    .replace(/\{perusahaan\}/gi, cv.targetCompany.trim())
    .replace(/\{tanggal\}/gi, todayISO());
  const base = safeFileName(prefix + filled)
    .replace(/_{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');
  return `${base || 'CV'}.${ext}`;
}
