import { Page, Text, View } from '@react-pdf/renderer';
import type { Entry, Section } from '../../types';
import type { CvCtx } from '../context';
import { ContactLine, EntryBlock, Headline, Name, PageFooter, paperTone, Photo, SectionBody, SectionHeading, type Tone } from '../parts';
import { SECTION_DEFS } from '../../presets/sections';
import { pageStyle, PersonalInline } from './common';

function Item({ ctx, e, s, tone, last }: { ctx: CvCtx; e: Entry; s: Section; tone: Tone; last: boolean }) {
  return (
    <View style={{ flexDirection: 'row' }} wrap={e.details.split('\n').length > 8}>
      <View style={{ width: 16, position: 'relative' }}>
        {!last && <View style={{ position: 'absolute', left: 7.4, top: 8, bottom: -3, width: 1.2, backgroundColor: tone.line }} />}
        <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: ctx.c.accent, backgroundColor: ctx.c.paper, marginTop: 3, marginLeft: 4 }} />
      </View>
      <View style={{ flex: 1, paddingLeft: 8 }}>
        <Text style={{ fontSize: ctx.fz.sm, color: ctx.c.accent, fontWeight: 700 }}>{ctx.range(e, s.type)}</Text>
        <EntryBlock ctx={ctx} entry={e} section={s} tone={tone} datePosition="left" />
      </View>
    </View>
  );
}

export function Timeline({ ctx }: { ctx: CvCtx }) {
  const tone = paperTone(ctx);
  const { c } = ctx;
  return (
    <Page size={ctx.size} style={pageStyle(ctx)}>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: ctx.sp.section }}>
        <Photo ctx={ctx} width={70} />
        <View style={{ flex: 1 }}>
          <Name ctx={ctx} color={c.primary} />
          <Headline ctx={ctx} color={c.accent} />
          <ContactLine ctx={ctx} tone={tone} icons />
          <PersonalInline ctx={ctx} tone={tone} />
        </View>
      </View>
      {ctx.sections.map((s) => {
        const def = SECTION_DEFS[s.type];
        const heading = <SectionHeading ctx={ctx} title={ctx.title(s)} tone={tone} />;
        if (def.kind !== 'entries' || !def.fields.range) {
          return (
            <View key={s.id} wrap={false} style={{ marginBottom: ctx.sp.section }}>
              {heading}
              <SectionBody ctx={ctx} section={s} tone={tone} />
            </View>
          );
        }
        const [first, ...rest] = s.entries;
        return (
          <View key={s.id} style={{ marginBottom: ctx.sp.section - ctx.sp.entry }}>
            <View wrap={false}>
              {heading}
              <Item ctx={ctx} e={first} s={s} tone={tone} last={!rest.length} />
            </View>
            {rest.map((e, i) => (
              <Item key={e.id} ctx={ctx} e={e} s={s} tone={tone} last={i === rest.length - 1} />
            ))}
          </View>
        );
      })}
      <PageFooter ctx={ctx} />
    </Page>
  );
}
