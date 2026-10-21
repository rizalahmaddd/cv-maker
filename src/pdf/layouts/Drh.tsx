import { Page, Text, View } from '@react-pdf/renderer';
import type { Entry, Section } from '../../types';
import { hexAlpha, type CvCtx } from '../context';
import { Details, LanguagesBlock, PageFooter, paperTone, PersonalTable, Photo, SkillsBlock, type Tone } from '../parts';
import { SECTION_DEFS } from '../../presets/sections';
import { pageStyle } from './common';
import { formatDay } from '../../lib/dates';
import { todayISO } from '../../lib/id';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII'];

function Heading({ ctx, n, title }: { ctx: CvCtx; n: number; title: string }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 5, borderBottomWidth: 0.8, borderBottomColor: ctx.c.primary, paddingBottom: 2 }}>
      <Text style={{ width: 26, fontFamily: ctx.head, fontWeight: 700, fontSize: ctx.fz.md, color: ctx.c.primary }}>{ROMAN[n] ?? n + 1}.</Text>
      <Text style={{ flex: 1, fontFamily: ctx.head, fontWeight: 700, fontSize: ctx.fz.md, color: ctx.c.primary }}>{title.toUpperCase()}</Text>
    </View>
  );
}

// Government, BUMN and many local offices still expect this numbered, table-like "Daftar Riwayat Hidup".
function Row({ ctx, e, s, tone, i }: { ctx: CvCtx; e: Entry; s: Section; tone: Tone; i: number }) {
  const def = SECTION_DEFS[s.type];
  const date = def.fields.range ? ctx.range(e, s.type) : '';
  const meta = [e.subtitle, def.fields.location ? e.location : '', def.fields.extra ? e.extra : '']
    .map((x) => x.trim())
    .filter(Boolean)
    .join(' · ');
  return (
    <View wrap={false} style={{ flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: tone.line }}>
      <Text style={{ width: 26, fontSize: ctx.fz.base, color: tone.muted }}>{i + 1}.</Text>
      <Text style={{ width: 92, fontSize: ctx.fz.sm, color: tone.muted, paddingRight: 6, lineHeight: 1.35 }}>{date}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: ctx.fz.base, fontWeight: 700, lineHeight: 1.35 }}>{e.title.trim() || e.subtitle.trim()}</Text>
        {e.title.trim() && meta ? <Text style={{ fontSize: ctx.fz.sm, color: tone.muted, lineHeight: 1.35 }}>{meta}</Text> : null}
        {def.fields.details ? <Details ctx={ctx} text={e.details} tone={tone} /> : null}
      </View>
    </View>
  );
}

export function Drh({ ctx }: { ctx: CvCtx }) {
  const tone = paperTone(ctx);
  const { c, fz, L } = ctx;
  let n = 1;
  return (
    <Page size={ctx.size} style={pageStyle(ctx)}>
      <Text style={{ fontFamily: ctx.head, fontWeight: 700, fontSize: fz.xl, textAlign: 'center', color: c.primary, letterSpacing: 0.6 }}>{L.curriculumVitae.toUpperCase()}</Text>
      <View style={{ height: 1.5, backgroundColor: c.primary, marginTop: 6, marginBottom: 1.5 }} />
      <View style={{ height: 0.6, backgroundColor: c.primary, marginBottom: ctx.sp.section }} />
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: ctx.sp.section }}>
        <View style={{ flex: 1 }}>
          <Heading ctx={ctx} n={0} title={L.personalData} />
          <View style={{ paddingLeft: 26 }}>
            <PersonalTable ctx={ctx} tone={tone} withName withContacts labelWidth={112} />
          </View>
        </View>
        {ctx.photo ? <Photo ctx={ctx} width={80} shape="square" border={hexAlpha(c.text, 0.3)} /> : null}
      </View>
      {ctx.sections.map((s) => {
        const def = SECTION_DEFS[s.type];
        const idx = n++;
        const title = ctx.title(s);
        if (def.kind === 'entries') {
          const [first, ...rest] = s.entries;
          return (
            <View key={s.id} style={{ marginBottom: ctx.sp.section }}>
              <View wrap={false}>
                <Heading ctx={ctx} n={idx} title={title} />
                <Row ctx={ctx} e={first} s={s} tone={tone} i={0} />
              </View>
              {rest.map((e, i) => (
                <Row key={e.id} ctx={ctx} e={e} s={s} tone={tone} i={i + 1} />
              ))}
            </View>
          );
        }
        return (
          <View key={s.id} wrap={false} style={{ marginBottom: ctx.sp.section }}>
            <Heading ctx={ctx} n={idx} title={title} />
            <View style={{ paddingLeft: 26 }}>
              {def.kind === 'text' ? <Details ctx={ctx} text={s.text} tone={tone} /> : null}
              {s.type === 'skills' ? <SkillsBlock ctx={ctx} section={s} tone={tone} /> : null}
              {s.type === 'languages' ? <LanguagesBlock ctx={ctx} section={s} tone={tone} /> : null}
              {s.type === 'hobbies' ? <Text style={{ fontSize: fz.base }}>{s.entries.map((e) => e.title).join(', ')}</Text> : null}
            </View>
          </View>
        );
      })}
      <View wrap={false} style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <View style={{ width: 190, alignItems: 'center' }}>
          <Text style={{ fontSize: fz.base, textAlign: 'center' }}>{[ctx.cv.personal.city.trim(), formatDay(todayISO(), ctx.cv.lang)].filter(Boolean).join(', ')}</Text>
          <Text style={{ fontSize: fz.base, marginTop: 2 }}>{ctx.cv.lang === 'id' ? 'Hormat saya,' : 'Sincerely,'}</Text>
          <View style={{ height: 46 }} />
          <Text style={{ fontSize: fz.base, fontWeight: 700, borderTopWidth: 0.6, borderTopColor: tone.muted, paddingTop: 2, width: 170, textAlign: 'center' }}>{ctx.name || ' '}</Text>
        </View>
      </View>
      <PageFooter ctx={ctx} />
    </Page>
  );
}
