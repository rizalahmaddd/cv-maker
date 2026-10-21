import { Page, Text, View } from '@react-pdf/renderer';
import type { CvCtx } from '../context';
import { ContactLine, EntryBlock, Headline, Name, PageFooter, paperTone, Photo, SectionBody } from '../parts';
import { SECTION_DEFS } from '../../presets/sections';
import { pageStyle } from './common';

const LABEL_W = 118;

// Section titles sit in a narrow left column, the way Europass and many European CVs read.
export function Europass({ ctx }: { ctx: CvCtx }) {
  const tone = paperTone(ctx);
  const { c, fz } = ctx;
  const label = (t: string) => (
    <Text style={{ width: LABEL_W, paddingRight: 12, textAlign: 'right', fontFamily: ctx.head, fontWeight: 700, fontSize: fz.sm, color: c.primary, lineHeight: 1.3, letterSpacing: 0.3 }}>{t}</Text>
  );
  return (
    <Page size={ctx.size} style={pageStyle(ctx)}>
      <View style={{ flexDirection: 'row', marginBottom: ctx.sp.section + 2 }}>
        <View style={{ width: LABEL_W, paddingRight: 12, alignItems: 'flex-end' }}>
          <Photo ctx={ctx} width={70} />
        </View>
        <View style={{ flex: 1, borderLeftWidth: 1.2, borderLeftColor: c.accent, paddingLeft: 12 }}>
          <Name ctx={ctx} color={c.primary} />
          <Headline ctx={ctx} color={c.accent} />
          <ContactLine ctx={ctx} tone={tone} icons />
        </View>
      </View>
      {ctx.personal.length ? (
        <View wrap={false} style={{ flexDirection: 'row', marginBottom: ctx.sp.section }}>
          {label(ctx.tpl.style.headingCase === 'upper' ? ctx.L.personalData.toUpperCase() : ctx.L.personalData)}
          <View style={{ flex: 1, paddingLeft: 13, gap: 2 }}>
            {ctx.personal.map((r) => (
              <Text key={r.key} style={{ fontSize: fz.base, lineHeight: 1.35 }}>
                <Text style={{ color: tone.muted }}>{r.label}: </Text>
                {r.value}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
      {ctx.sections.map((s) => {
        const def = SECTION_DEFS[s.type];
        if (def.kind !== 'entries') {
          return (
            <View key={s.id} wrap={false} style={{ flexDirection: 'row', marginBottom: ctx.sp.section }}>
              {label(ctx.title(s))}
              <View style={{ flex: 1, paddingLeft: 13 }}>
                <SectionBody ctx={ctx} section={s} tone={tone} />
              </View>
            </View>
          );
        }
        return (
          <View key={s.id} style={{ marginBottom: ctx.sp.section - ctx.sp.entry }}>
            {s.entries.map((e, i) => (
              <View key={e.id} style={{ flexDirection: 'row' }} wrap={e.details.split('\n').length > 8}>
                {i === 0 ? label(ctx.title(s)) : <View style={{ width: LABEL_W }} />}
                <View style={{ flex: 1, paddingLeft: 13 }}>
                  <EntryBlock ctx={ctx} entry={e} section={s} tone={tone} />
                </View>
              </View>
            ))}
          </View>
        );
      })}
      <PageFooter ctx={ctx} />
    </Page>
  );
}
