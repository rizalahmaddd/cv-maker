import { Page, Text, View } from '@react-pdf/renderer';
import type { CvCtx } from '../context';
import { Headline, Name, PageFooter, paperTone, PersonalTable, Photo, SectionHeading, SectionView } from '../parts';
import { pageStyle } from './common';

export function Formal({ ctx }: { ctx: CvCtx }) {
  const tone = paperTone(ctx);
  const { c, fz, L } = ctx;
  return (
    <Page size={ctx.size} style={pageStyle(ctx)}>
      <Text style={{ fontFamily: ctx.head, fontWeight: 700, fontSize: fz.sm, letterSpacing: 0.8, color: c.accent, marginBottom: 6 }}>{L.curriculumVitae.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', gap: 18, marginBottom: ctx.sp.section }}>
        <View style={{ flex: 1 }}>
          <Name ctx={ctx} color={c.primary} />
          <Headline ctx={ctx} color={c.accent} />
          <View style={{ marginTop: 10 }}>
            <SectionHeading ctx={ctx} title={ctx.tpl.style.headingCase === 'upper' ? L.personalData.toUpperCase() : L.personalData} tone={tone} />
            <PersonalTable ctx={ctx} tone={tone} withContacts labelWidth={118} />
          </View>
        </View>
        {ctx.photo ? <Photo ctx={ctx} width={86} border={c.primary} /> : null}
      </View>
      {ctx.sections.map((s) => (
        <SectionView key={s.id} ctx={ctx} section={s} tone={tone} />
      ))}
      <PageFooter ctx={ctx} />
    </Page>
  );
}
