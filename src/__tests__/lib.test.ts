import { describe, expect, it } from 'vitest';
import { splitLegacyEducation, formatScore, decimalInput, canonical, GENDERS } from '../presets/personal';
import { parseDetails, normalizeText, stripBullet } from '../lib/text';
import { formatRange, compareRangeDesc } from '../lib/dates';
import { normalizePhone, normalizeUrl, isEmail } from '../lib/contact';

describe('legacy education', () => {
  it('splits degree and GPA', () => {
    const e = splitLegacyEducation({ subtitle: 'S1 Manajemen', extra: 'IPK 3,68 / 4,00 (Cum Laude)' });
    expect(e).toMatchObject({ degree: 'S1', subtitle: 'Manajemen', score: '3.68', scoreMax: '4', extra: 'Cum Laude' });
  });
  it('leaves unknown text', () => {
    expect(splitLegacyEducation({ subtitle: 'Teknik Sipil', extra: '' })).toMatchObject({ degree: '', subtitle: 'Teknik Sipil' });
  });
  it('keeps structured entries untouched', () => {
    const e = { subtitle: 'S1 X', extra: '', degree: 'S2' };
    expect(splitLegacyEducation(e)).toBe(e);
  });
});

describe('score', () => {
  it('formats per language', () => {
    expect(formatScore('3.5', '4', 'S1', 'id')).toBe('IPK 3,50 / 4,00');
    expect(formatScore('3.5', '4', 'S1', 'en')).toBe('GPA 3.50 / 4.00');
    expect(formatScore('85', '100', 'SMA', 'id')).toBe('Nilai rata-rata 85 / 100');
  });
  it('sanitises decimal input', () => {
    expect(decimalInput('3,756a')).toBe('3.75');
    expect(decimalInput('abc')).toBe('');
  });
  it('maps free-text gender', () => {
    expect(canonical('Perempuan', GENDERS)).toBe('female');
    expect(canonical('Pria', GENDERS)).toBe('male');
  });
});

describe('text', () => {
  it('parses bullets and paragraphs', () => {
    expect(parseDetails('• satu\n- dua\n3) tiga')).toEqual({ paragraphs: [], bullets: ['satu', 'dua', 'tiga'] });
    expect(parseDetails('Kalimat tunggal.')).toEqual({ paragraphs: ['Kalimat tunggal.'], bullets: [] });
  });
  it('normalises pasted characters', () => {
    expect(normalizeText('a b​ “c”\r\n')).toBe('a b "c"\n');
    expect(stripBullet('  ✓ Done')).toBe('Done');
  });
});

describe('dates', () => {
  it('formats ranges', () => {
    expect(formatRange({ start: { y: 2020, m: 8 }, end: {}, current: true }, 'id', 'short')).toBe('Agu 2020 – Sekarang');
    expect(formatRange({ start: { y: 2017 }, end: { y: 2020 }, current: false }, 'en', 'long')).toBe('2017 – 2020');
  });
  it('sorts newest first', () => {
    const a = { start: { y: 2019 }, end: { y: 2020 }, current: false };
    const b = { start: { y: 2021 }, end: {}, current: true };
    expect([a, b].sort(compareRangeDesc)[0]).toBe(b);
  });
});

describe('contact', () => {
  it('normalises Indonesian numbers', () => {
    expect(normalizePhone('0812-3456-7890')).toBe('+62 812-3456-7890');
    expect(normalizePhone('+6281234567890')).toBe('+62 812-3456-7890');
  });
  it('builds urls', () => {
    expect(normalizeUrl('@nadia', 'instagram')).toBe('https://instagram.com/nadia');
    expect(normalizeUrl('linkedin.com/in/x')).toBe('https://linkedin.com/in/x');
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
  });
});
