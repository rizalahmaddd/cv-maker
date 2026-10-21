import { Page, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import type { Entry, YM } from '../../types';
import type { CvCtx } from '../context';
import { Photo } from '../parts';
import { ageFrom, hasDate, ymValue, nowYM } from '../../lib/dates';
import { parseDetails } from '../../lib/text';
import { LANGUAGE_LEVELS } from '../../presets/sections';

const LINE = '#333333';
const cell: Style = { borderColor: LINE, borderStyle: 'solid' };

interface Row {
  y: string;
  m: string;
  text: string;
  align?: 'left' | 'center' | 'right';
}

const ym = (d: YM): Pick<Row, 'y' | 'm'> => ({ y: hasDate(d) ? String(d.y) : '', m: d.m ? String(d.m) : '' });

// A rirekisho lists each school or job as dated events: entered/graduated, joined/left.
function historyRows(ctx: CvCtx): Row[] {
  const now = ymValue(nowYM());
  const of = (t: string) => ctx.sections.filter((s) => s.type === t).flatMap((s) => s.entries);
  const name = (e: Entry) => [e.title.trim(), e.subtitle.trim()].filter(Boolean).join(' ');
  const rows: Row[] = [{ y: '', m: '', text: '学歴', align: 'center' }];
  const edu = [...of('education')].sort((a, b) => (ymValue(a.range.start) || 0) - (ymValue(b.range.start) || 0));
  for (const e of edu) {
    if (hasDate(e.range.start)) rows.push({ ...ym(e.range.start), text: `${name(e)} 入学` });
    if (e.range.current || ymValue(e.range.end) > now) rows.push({ ...ym(e.range.end), text: `${name(e)} 卒業見込み` });
    else if (hasDate(e.range.end)) rows.push({ ...ym(e.range.end), text: `${name(e)} 卒業` });
  }
  const jobs = [...of('experience'), ...of('internship')].sort((a, b) => (ymValue(a.range.start) || 0) - (ymValue(b.range.start) || 0));
  rows.push({ y: '', m: '', text: '職歴', align: 'center' });
  if (!jobs.length) rows.push({ y: '', m: '', text: 'なし' });
  for (const e of jobs) {
    const company = e.subtitle.trim() || e.title.trim();
    if (hasDate(e.range.start)) rows.push({ ...ym(e.range.start), text: `${company} 入社${e.title.trim() && e.subtitle.trim() ? `（${e.title.trim()}）` : ''}` });
    const first = parseDetails(e.details).bullets[0];
    if (first) rows.push({ y: '', m: '', text: `　${first}` });
    if (e.range.current) rows.push({ y: '', m: '', text: '現在に至る' });
    else if (hasDate(e.range.end)) rows.push({ ...ym(e.range.end), text: `${company} 退社` });
  }
  rows.push({ y: '', m: '', text: '以上', align: 'right' });
  return rows;
}

function licenseRows(ctx: CvCtx): Row[] {
  const rows: Row[] = [];
  const of = (t: string) => ctx.sections.filter((s) => s.type === t).flatMap((s) => s.entries);
  for (const e of [...of('certifications'), ...of('training'), ...of('awards')]) {
    const d = e.range.end.y ? e.range.end : e.range.start;
    rows.push({ ...ym(d), text: [e.title.trim(), e.subtitle.trim() && `（${e.subtitle.trim()}）`].filter(Boolean).join(' ') });
  }
  for (const e of of('languages')) {
    if (e.extra.trim()) rows.push({ y: '', m: '', text: `${e.title.trim()} ${e.extra.trim()}` });
  }
  if (ctx.cv.personal.drivingLicense.trim()) rows.push({ y: '', m: '', text: `運転免許 SIM ${ctx.cv.personal.drivingLicense.trim()}（インドネシア）` });
  return rows;
}

function Table({ ctx, title, rows, min }: { ctx: CvCtx; title: string; rows: Row[]; min: number }) {
  const fs = ctx.fz.base;
  const padded: Row[] = [...rows, ...Array.from({ length: Math.max(0, min - rows.length) }, () => ({ y: '', m: '', text: '' }))];
  const head: Style = { fontSize: fs - 1, textAlign: 'center', paddingVertical: 3 };
  return (
    <View style={{ ...cell, borderWidth: 1.2, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', borderBottomWidth: 0.8, ...cell }} fixed>
        <Text style={{ ...head, width: 46, borderRightWidth: 0.6, ...cell }}>年</Text>
        <Text style={{ ...head, width: 26, borderRightWidth: 0.6, ...cell }}>月</Text>
        <Text style={{ ...head, flex: 1 }}>{title}</Text>
      </View>
      {padded.map((r, i) => (
        <View key={i} wrap={false} style={{ flexDirection: 'row', minHeight: 21, borderTopWidth: i ? 0.5 : 0, borderTopStyle: 'dashed', borderTopColor: '#888888' }}>
          <Text style={{ width: 46, fontSize: fs, textAlign: 'center', paddingTop: 4, borderRightWidth: 0.6, ...cell }}>{r.y}</Text>
          <Text style={{ width: 26, fontSize: fs, textAlign: 'center', paddingTop: 4, borderRightWidth: 0.6, ...cell }}>{r.m}</Text>
          <Text style={{ flex: 1, fontSize: fs, paddingHorizontal: 6, paddingVertical: 4, textAlign: r.align ?? 'left', lineHeight: 1.35 }}>{r.text}</Text>
        </View>
      ))}
    </View>
  );
}

function Box({ ctx, label, text, height }: { ctx: CvCtx; label: string; text: string; height: number }) {
  return (
    <View wrap={false} style={{ ...cell, borderWidth: 1.2, minHeight: height, padding: 6, marginBottom: 10 }}>
      <Text style={{ fontSize: ctx.fz.sm, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: ctx.fz.base, lineHeight: 1.5 }}>{text}</Text>
    </View>
  );
}

// JIS-style rirekisho, the format Japanese employers and Indonesian sending agencies (LPK/SO) expect.
export function Rirekisho({ ctx }: { ctx: CvCtx }) {
  const p = ctx.cv.personal;
  const fs = ctx.fz.base;
  const today = new Date();
  const age = p.birthDate ? ageFrom(p.birthDate) : null;
  const [by, bm, bd] = p.birthDate ? p.birthDate.split('-').map(Number) : [];
  const gender = p.gender === 'male' ? '男' : p.gender === 'female' ? '女' : '';
  const summary = ctx.sections.find((s) => s.type === 'summary')?.text ?? '';
  const skills = ctx.sections.filter((s) => s.type === 'skills').flatMap((s) => s.entries.map((e) => e.title.trim()));
  const langs = ctx.sections
    .filter((s) => s.type === 'languages')
    .flatMap((s) => s.entries.map((e) => `${e.title.trim()}${e.subtitle.trim() || e.level ? `（${e.subtitle.trim() || LANGUAGE_LEVELS.en[e.level]}）` : ''}`));
  const pr = [summary, skills.length ? `特技・スキル：${skills.join('、')}` : '', langs.length ? `語学：${langs.join('、')}` : ''].filter(Boolean).join('\n');
  const label: Style = { fontSize: fs - 1.5, color: '#444444' };
  return (
    <Page size={ctx.size} style={{ fontFamily: 'notojp', color: '#111111', backgroundColor: '#ffffff', paddingHorizontal: 34, paddingVertical: 30, fontSize: fs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
        <Text style={{ fontSize: 20, fontWeight: 700, letterSpacing: 8 }}>履歴書</Text>
        <Text style={{ fontSize: fs }}>
          {today.getFullYear()}年 {today.getMonth() + 1}月 {today.getDate()}日現在
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <View style={{ flex: 1, ...cell, borderWidth: 1.2 }}>
          <View style={{ padding: 5, borderBottomWidth: 0.5, borderBottomStyle: 'dashed', borderBottomColor: '#888888' }}>
            <Text style={label}>ふりがな</Text>
            <Text style={{ fontSize: fs }}> </Text>
          </View>
          <View style={{ padding: 5, minHeight: 48, borderBottomWidth: 0.8, ...cell }}>
            <Text style={label}>氏名</Text>
            <Text style={{ fontSize: 17, fontWeight: 700, marginTop: 4, marginLeft: 10 }}>{ctx.name || ' '}</Text>
          </View>
          <View style={{ flexDirection: 'row', borderBottomWidth: 0.8, ...cell }}>
            <View style={{ flex: 1, padding: 5 }}>
              <Text style={label}>生年月日</Text>
              <Text style={{ fontSize: fs, marginTop: 2 }}>{by ? `${by}年 ${bm}月 ${bd}日生（満 ${age} 歳）` : ''}</Text>
            </View>
            <View style={{ width: 70, padding: 5, borderLeftWidth: 0.6, ...cell }}>
              <Text style={label}>性別</Text>
              <Text style={{ fontSize: fs, marginTop: 2, textAlign: 'center' }}>{gender}</Text>
            </View>
          </View>
          <View style={{ padding: 5, minHeight: 40, borderBottomWidth: 0.8, ...cell }}>
            <Text style={label}>現住所</Text>
            <Text style={{ fontSize: fs, marginTop: 2, lineHeight: 1.4 }}>{p.address.trim() || [p.city.trim(), p.region.trim(), p.country.trim() || 'Indonesia'].filter(Boolean).join(', ')}</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, padding: 5 }}>
              <Text style={label}>電話</Text>
              <Text style={{ fontSize: fs, marginTop: 2 }}>{p.phone}</Text>
            </View>
            <View style={{ flex: 1.4, padding: 5, borderLeftWidth: 0.6, ...cell }}>
              <Text style={label}>E-mail</Text>
              <Text style={{ fontSize: fs, marginTop: 2 }}>{p.email}</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 86, alignItems: 'center' }}>
          {ctx.photo ? (
            <Photo ctx={ctx} width={85} ratio={4 / 3} shape="square" border={LINE} />
          ) : (
            <View style={{ width: 85, height: 113, borderWidth: 0.8, borderStyle: 'dashed', borderColor: '#888888', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
              <Text style={{ fontSize: 7, textAlign: 'center', color: '#666666' }}>写真をはる位置{'\n'}縦 40mm × 横 30mm</Text>
            </View>
          )}
        </View>
      </View>
      <Table ctx={ctx} title="学歴・職歴" rows={historyRows(ctx)} min={16} />
      <Table ctx={ctx} title="免許・資格" rows={licenseRows(ctx)} min={5} />
      <Box ctx={ctx} label="志望の動機、特技、好きな学科、アピールポイントなど" text={pr} height={110} />
      <Box ctx={ctx} label="本人希望記入欄（特に給料・職種・勤務時間・勤務地・その他についての希望などがあれば記入）" text="貴社の規定に従います。" height={50} />
    </Page>
  );
}
