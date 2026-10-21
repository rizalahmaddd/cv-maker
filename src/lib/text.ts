const BULLET = /^\s*(?:[•●▪■◦○◆◇►▸‣⁃∙·*\-–—✓✔➢➤→]+|\(?\d{1,2}[.)]|[a-z][.)])\s+/u;

// Text pasted from Word, PDFs or WhatsApp carries characters that render as boxes or break wrapping in the PDF.
export function normalizeText(s: string): string {
  return s
    .replace(/\r\n?/g, '\n')
    .replace(/[​-‍⁠﻿]/g, '')
    .replace(/[   ]/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/…/g, '...');
}

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{20E3}\u{1F3FB}-\u{1F3FF}]/gu;

export function hasEmoji(s: string): boolean {
  EMOJI.lastIndex = 0;
  return EMOJI.test(s);
}

// The bundled fonts only carry the Latin subset; anything outside it would print as an empty box.
const UNSUPPORTED = /[^\u0000-ɏḀ-ỿ -⁯₠-⃏℀-⅏←-⇿∀-⋿■-◿]/gu;

export function unsupportedChars(s: string): string[] {
  const found = new Set<string>();
  for (const ch of s.replace(EMOJI, '').matchAll(UNSUPPORTED)) found.add(ch[0]);
  return [...found];
}

export function pdfSafe(s: string): string {
  return normalizeText(s)
    .replace(EMOJI, '')
    .replace(/[ ]{2,}/g, ' ');
}

export function splitLines(s: string): string[] {
  return normalizeText(s)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export function stripBullet(line: string): string {
  return line.replace(BULLET, '').trim();
}

export function isBulletLine(line: string): boolean {
  return BULLET.test(line);
}

export interface ParsedDetails {
  paragraphs: string[];
  bullets: string[];
}

// One line is a sentence; several lines (or lines starting with a marker) are bullet points.
export function parseDetails(s: string): ParsedDetails {
  const lines = splitLines(s);
  if (!lines.length) return { paragraphs: [], bullets: [] };
  if (lines.length === 1 && !isBulletLine(lines[0])) return { paragraphs: [lines[0]], bullets: [] };
  const paragraphs: string[] = [];
  const bullets: string[] = [];
  for (const l of lines) {
    if (!bullets.length && !isBulletLine(l) && lines.some(isBulletLine)) paragraphs.push(l);
    else bullets.push(stripBullet(l));
  }
  return { paragraphs, bullets: bullets.filter(Boolean) };
}

export function cleanPastedList(s: string): string {
  return splitLines(s).map(stripBullet).filter(Boolean).join('\n');
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function splitList(s: string): string[] {
  return normalizeText(s)
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}
