import type { Entry, Section } from '../types';
import { SECTION_DEFS } from '../presets/sections';

export function entryHasContent(e: Entry): boolean {
  return !e.hidden && !!(e.title.trim() || e.subtitle.trim() || e.details.trim() || e.extra.trim() || e.degree);
}

export function sectionHasContent(s: Section): boolean {
  if (!s.visible) return false;
  if (SECTION_DEFS[s.type].kind === 'text') return !!s.text.trim();
  return s.entries.some(entryHasContent);
}
