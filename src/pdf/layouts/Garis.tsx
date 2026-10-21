import { Page, Text, View } from '@react-pdf/renderer';
import type { Entry } from '../../types';
import type { CvCtx } from '../context';
import { ContactLine, EntryBlock, Headline, Name, PageFooter, paperTone, Photo, SectionBody, SectionHeading } from '../parts';
import { SECTION_DEFS } from '../../presets/sections';
import { pageStyle, PersonalInline } from './common';

const DATE_COL = 92;

export function Garis({ ctx }: { ctx: CvCtx }) {
  const tone = paperTone(ctx);
  const { fz, c } = ctx;
  return (
    <Page size={ctx.size} style={pageStyle(ctx)}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', paddingBottom: 10, marginBottom: ctx.sp.section, borderBottomWidth: 1.2, borderBottomColor: c.primary }}>
        <View style={{ flex: 1 }}>
          <Name ctx={ctx} color={c.primary} />
          <Headline ctx={ctx} color={c.accent} />
          <ContactLine ctx={ctx} tone={tone} />
          <PersonalInline ctx={ctx} tone={tone} />
        </View>
        <Photo ctx={ctx} width={62} />
      </View>
      {ctx.sections.map((s) => {
        const def = SECTION_DEFS[s.type];
        const heading = <SectionHeading ctx={ctx} title={ctx.title(s)} tone={tone} />;
        if (def.kind !== 'entries' || !def.fields.range) {
          return (
            <View key={s.id} wrap={false} style={{ marginBottom: ctx.sp.section }}>
              {heading}
              <View style={{ marginLeft: DATE_COL }}>
                <SectionBody ctx={ctx} section={s} tone={tone} />
              </View>
            </View>
          );
        }
        const row = (e: Entry) => (
          <View key={e.id} style={{ flexDirection: 'row' }}>
            <Text style={{ width: DATE_COL, paddingRight: 8, fontSize: fz.sm, color: tone.muted, lineHeight: 1.3, paddingTop: 1 }}>{ctx.range(e, s.type)}</Text>
            <View style={{ flex: 1 }}>
              <EntryBlock ctx={ctx} entry={e} section={s} tone={tone} datePosition="left" />
            </View>
          </View>
        );
        const [first, ...rest] = s.entries;
        return (
          <View key={s.id} style={{ marginBottom: ctx.sp.section - ctx.sp.entry }}>
            <View wrap={false}>
              {heading}
              {row(first)}
            </View>
            {rest.map(row)}
          </View>
        );
      })}
      <PageFooter ctx={ctx} />
    </Page>
  );
}
