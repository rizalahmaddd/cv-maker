import type { Cv } from '../types';
import { countryPreset } from '../presets/countries';

export interface Step {
  key: string;
  label: string;
  done: boolean;
}

export function cvSteps(cv: Cv): Step[] {
  const p = cv.personal;
  const has = (t: string) => cv.sections.some((s) => s.visible && s.type === t && s.entries.some((e) => e.title.trim() || e.subtitle.trim()));
  const summary = cv.sections.find((s) => s.type === 'summary' && s.visible);
  const skills = cv.sections.filter((s) => s.type === 'skills' && s.visible).flatMap((s) => s.entries.filter((e) => e.title.trim()));
  const steps: Step[] = [
    { key: 'name', label: 'Nama lengkap', done: !!p.fullName.trim() },
    { key: 'contact', label: 'Email & nomor HP', done: !!p.email.trim() && !!p.phone.trim() },
    { key: 'summary', label: 'Ringkasan diri', done: !summary || summary.text.trim().length >= 60 },
    { key: 'education', label: 'Pendidikan', done: has('education') },
    { key: 'experience', label: 'Pengalaman (kerja, magang, atau organisasi)', done: has('experience') || has('internship') || has('organization') || has('projects') },
    { key: 'skills', label: 'Minimal 3 keahlian', done: skills.length >= 3 },
  ];
  if (countryPreset(cv.country).photo === 'expected' && cv.options.showPhoto) steps.push({ key: 'photo', label: 'Foto', done: !!cv.photoId });
  return steps;
}

export function cvProgress(cv: Cv): number {
  const s = cvSteps(cv);
  return Math.round((s.filter((x) => x.done).length / s.length) * 100);
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const min = Math.round(diff / 60000);
  if (min < 1) return 'baru saja';
  if (min < 60) return `${min} menit lalu`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
