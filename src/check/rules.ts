import type { Cv, Entry, Section, TemplateConfig } from '../types';
import { ageFrom, hasDate, nowYM, ymValue } from '../lib/dates';
import { isEmail, isValidUrl, phoneHasCountryCode } from '../lib/contact';
import { hasEmoji, parseDetails, unsupportedChars } from '../lib/text';
import { countryPreset } from '../presets/countries';
import { SECTION_DEFS, sectionTitle } from '../presets/sections';
import { layoutMeta, templateAts } from '../templates';
import { entryHasContent, sectionHasContent } from '../lib/content';

export type Level = 'error' | 'warn' | 'tip';

export interface Issue {
  id: string;
  level: Level;
  message: string;
  target?: string;
}

const SLANG = /(imut|cute|manis|cantik|ganteng|cakep|baby|bebeb|sayang|love|lovely|kece|lucu|princess|prince|cool|keren|galau|unyu|alay|xx|gokil|boy|girl|angel)/i;
const ID_WORDS = /\b(dan|yang|dengan|untuk|dalam|pada|sebagai|melakukan|membuat|mengelola|dari|ke|di)\b/gi;
const EN_PRONOUN = /(^|\s)(I|my|me)\s/;
const NIK = /(?<!\d)\d{16}(?!\d)/;

const EXP_TYPES = new Set(['experience', 'internship', 'organization', 'projects', 'volunteer', 'committee']);

function allText(cv: Cv): string {
  const p = cv.personal;
  return [p.fullName, p.headline, p.address, ...cv.sections.flatMap((s) => [s.title, s.text, ...s.entries.flatMap((e) => [e.title, e.subtitle, e.location, e.details, e.extra])])].join('\n');
}

function entryName(e: Entry) {
  return e.title.trim() || e.subtitle.trim() || 'isian tanpa judul';
}

export function checkCv(cv: Cv, tpl: TemplateConfig | undefined, pages?: number): Issue[] {
  const out: Issue[] = [];
  const add = (level: Level, id: string, message: string, target?: string) => out.push({ id, level, message, target });
  const p = cv.personal;
  const preset = countryPreset(cv.country);
  const abroad = cv.country !== 'ID';
  const now = ymValue(nowYM());

  if (!p.fullName.trim()) add('error', 'name', 'Nama lengkap belum diisi.', 'personal');
  if (!p.email.trim() && !p.phone.trim()) add('error', 'contact', 'Tambahkan email atau nomor HP supaya HRD bisa menghubungi Anda.', 'personal');
  if (p.email.trim() && !isEmail(p.email)) add('error', 'email', `Format email "${p.email}" belum benar.`, 'personal');
  else if (p.email.trim() && SLANG.test(p.email.split('@')[0])) add('warn', 'email-pro', 'Email terkesan kurang profesional. Sebaiknya pakai format nama.lengkap@gmail.com.', 'personal');
  if (!p.email.trim() && p.phone.trim()) add('tip', 'email-missing', 'Banyak perusahaan mengirim undangan tes lewat email. Tambahkan alamat email.', 'personal');
  if (p.phone.trim()) {
    const digits = p.phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) add('warn', 'phone-len', 'Nomor HP sepertinya kurang atau kelebihan digit.', 'personal');
    else if (abroad && !phoneHasCountryCode(p.phone)) add('warn', 'phone-cc', 'Untuk lamaran ke luar negeri, tulis nomor HP dengan kode negara (+62 812-...).', 'personal');
  }
  for (const l of p.links) if (l.url.trim() && !l.url.trim().startsWith('@') && !isValidUrl(l.url)) add('warn', `link-${l.id}`, `Tautan "${l.url}" sepertinya tidak valid.`, 'personal');
  if (p.birthDate) {
    const age = ageFrom(p.birthDate);
    if (age !== null && (age < 14 || age > 80)) add('warn', 'birth', 'Tanggal lahir sepertinya keliru.', 'personal');
  }

  const visible = cv.sections.filter(sectionHasContent);
  const has = (pred: (s: Section) => boolean) => visible.some(pred);
  if (!has((s) => s.type === 'education')) add('warn', 'edu', 'Belum ada riwayat pendidikan.');
  if (!has((s) => EXP_TYPES.has(s.type))) add('warn', 'exp', 'Belum ada pengalaman. Fresh graduate bisa mengisi magang, organisasi, kepanitiaan, atau proyek kuliah.');
  const summary = cv.sections.find((s) => s.type === 'summary');
  const words = summary?.text.trim() ? summary.text.trim().split(/\s+/).length : 0;
  if (!summary || !summary.visible || !words) add('tip', 'summary', 'Ringkasan 2–4 kalimat di bagian atas membantu HRD cepat paham profil Anda.', summary?.id);
  else if (words < 20) add('tip', 'summary-short', 'Ringkasan masih terlalu singkat. Ceritakan keahlian utama dan posisi yang dicari.', summary.id);
  else if (words > 120) add('tip', 'summary-long', `Ringkasan cukup panjang (${words} kata). Idealnya di bawah 90 kata.`, summary.id);
  const skills = visible.filter((s) => s.type === 'skills').flatMap((s) => s.entries.filter(entryHasContent));
  if (skills.length < 3) add('tip', 'skills', 'Tambahkan minimal 3 keahlian yang sesuai lowongan.', cv.sections.find((s) => s.type === 'skills')?.id);

  let numberHint = false;
  for (const s of cv.sections) {
    const def = SECTION_DEFS[s.type];
    const name = sectionTitle(s.type, 'id', s.title);
    if (s.visible && !sectionHasContent(s) && (s.entries.length || s.text)) add('tip', `empty-${s.id}`, `Bagian "${name}" belum ada isinya sehingga tidak tampil.`, s.id);
    if (!s.visible) continue;
    const seen = new Set<string>();
    for (const e of s.entries.filter(entryHasContent)) {
      const key = `${e.title.trim().toLowerCase()}|${e.subtitle.trim().toLowerCase()}`;
      if (seen.has(key)) add('tip', `dup-${e.id}`, `"${entryName(e)}" tercantum dua kali di ${name}.`, s.id);
      seen.add(key);
      if (def.fields.range && !def.singleDate) {
        const start = ymValue(e.range.start);
        const end = ymValue(e.range.end);
        if (!e.range.current && start > end) add('error', `range-${e.id}`, `${name}: tanggal selesai "${entryName(e)}" lebih awal dari tanggal mulai.`, s.id);
        if (start > now) add('warn', `future-${e.id}`, `${name}: tanggal mulai "${entryName(e)}" ada di masa depan.`, s.id);
        if (!e.range.current && end > now) {
          if (s.type === 'education') add('tip', `grad-${e.id}`, `Pendidikan "${entryName(e)}" belum selesai. Centang "Masih berlangsung" atau tulis "Perkiraan lulus" di kolom IPK.`, s.id);
          else add('warn', `end-${e.id}`, `${name}: tanggal selesai "${entryName(e)}" ada di masa depan. Centang "Masih berlangsung" bila masih aktif.`, s.id);
        }
        if (EXP_TYPES.has(s.type) && !hasDate(e.range.start) && s.type !== 'projects') add('tip', `nodate-${e.id}`, `${name}: "${entryName(e)}" belum ada periodenya.`, s.id);
      }
      if (s.type === 'experience' || s.type === 'internship') {
        const d = parseDetails(e.details);
        if (!d.bullets.length && !d.paragraphs.length) add('tip', `nodetail-${e.id}`, `Tambahkan tanggung jawab atau pencapaian untuk "${entryName(e)}".`, s.id);
        if (d.bullets.length > 8) add('tip', `many-${e.id}`, `"${entryName(e)}" punya ${d.bullets.length} poin. 3–6 poin terpenting biasanya cukup.`, s.id);
        if (d.bullets.length && !d.bullets.some((b) => /\d/.test(b))) numberHint = true;
        if (d.bullets.some((b) => b.length > 220)) add('tip', `long-${e.id}`, `Ada poin yang sangat panjang di "${entryName(e)}". Pecah menjadi beberapa poin singkat.`, s.id);
        if (cv.lang === 'en' && [...d.bullets, ...d.paragraphs].some((b) => EN_PRONOUN.test(` ${b}`)))
          add('tip', `pronoun-${e.id}`, `Hindari kata "I/my" di CV bahasa Inggris. Awali poin dengan kata kerja (Managed, Built, Led).`, s.id);
      }
    }
  }
  if (numberHint) add('tip', 'numbers', 'Sertakan angka di poin pengalaman (jumlah, persen, target) supaya pencapaian lebih meyakinkan.');

  const text = allText(cv);
  if (cv.lang === 'en') {
    const idHits = text.match(ID_WORDS)?.length ?? 0;
    if (idHits >= 6) add('warn', 'mixed-lang', 'CV disetel bahasa Inggris tetapi sebagian isinya masih berbahasa Indonesia.', 'setup');
  }
  const placeholder = /\[[^\]\n]{1,40}\]/.exec(text);
  if (placeholder) add('error', 'placeholder', `Masih ada teks contoh ${placeholder[0]} yang belum diganti.`);
  if (NIK.test(text)) add('warn', 'nik', 'Sepertinya ada nomor NIK/KTP 16 digit di CV. Demi keamanan, jangan cantumkan nomor identitas.');
  if (hasEmoji(text)) add('warn', 'emoji', 'Emoji tidak ikut tercetak di PDF dan sebaiknya tidak dipakai di CV.');
  const bad = tpl?.layout === 'rirekisho' ? [] : unsupportedChars(text);
  if (bad.length) add('warn', 'glyph', `Karakter ${bad.slice(0, 5).join(' ')} tidak didukung font template ini dan akan hilang di PDF. Huruf Jepang hanya didukung template Rirekisho.`);

  const flags = cv.options.personal;
  if (preset.photo === 'avoid') {
    if (cv.options.showPhoto && cv.photoId) add('warn', 'photo-avoid', `CV untuk ${preset.name} sebaiknya tanpa foto untuk menghindari bias.`, 'setup');
    const sensitive = (['birth', 'gender', 'religion', 'marital', 'body'] as const).filter((f) => flags[f]);
    if (sensitive.length) add('warn', 'personal-avoid', `Data pribadi seperti umur, agama, atau status pernikahan tidak lazim dicantumkan di ${preset.name}.`, 'setup');
  }
  if (preset.photo === 'expected' && cv.options.showPhoto && !cv.photoId) add('tip', 'photo-missing', 'Perusahaan di negara tujuan ini biasanya mengharapkan pas foto.', 'personal');
  if (tpl && cv.options.showPhoto && cv.photoId && !layoutMeta(tpl.layout).photo)
    add('tip', 'photo-layout', `Template ${tpl.name} tidak menampilkan foto. Pilih template Formal, Modern, Sidebar, atau Kepala Warna.`, 'setup');
  if (flags.religion && cv.country === 'ID') add('tip', 'religion', 'Agama tidak wajib dicantumkan kecuali diminta lowongan.', 'setup');
  if (flags.address && abroad) add('tip', 'address-abroad', 'Alamat lengkap tidak diperlukan untuk lamaran luar negeri; cukup kota dan negara.', 'setup');
  if (abroad && cv.lang === 'id') add('warn', 'lang-abroad', 'Lamaran ke luar negeri sebaiknya memakai CV berbahasa Inggris.', 'setup');

  if (tpl) {
    const ats = templateAts(tpl);
    if (ats !== 'safe')
      add('tip', 'ats', `Template ${tpl.name} memakai kolom atau grafik yang kadang salah dibaca sistem ATS. Untuk lamaran lewat portal (JobStreet, LinkedIn, Glints), unduh juga versi ATS.`);
  }

  if (pages) {
    const experienced = visible.filter((s) => s.type === 'experience').flatMap((s) => s.entries).length >= 3;
    if (!experienced && pages > 1) add('tip', 'pages', `CV ${pages} halaman. Fresh graduate idealnya 1 halaman: ringkas poin atau aktifkan "Muat dalam 1 halaman".`);
    else if (pages > 2) add('warn', 'pages', `CV ${pages} halaman. Usahakan maksimal 2 halaman.`);
  }

  const order: Record<Level, number> = { error: 0, warn: 1, tip: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}

export function score(issues: Issue[]): number {
  const penalty = issues.reduce((n, i) => n + (i.level === 'error' ? 18 : i.level === 'warn' ? 8 : 3), 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}
