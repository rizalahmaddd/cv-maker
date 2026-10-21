import { Page, View } from '@react-pdf/renderer';
import type { CvCtx } from '../context';
import { ContactLine, Headline, Name, PageFooter, paperTone, Photo, Qr, SectionView } from '../parts';
import { pageStyle, PersonalInline } from './common';

export function Modern({ ctx }: { ctx: CvCtx }) {
  const tone = paperTone(ctx);
  const { c } = ctx;
  return (
    <Page size={ctx.size} style={pageStyle(ctx)}>
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: ctx.sp.section }}>
        <View style={{ flex: 1 }}>
          <Name ctx={ctx} color={c.primary} />
          <Headline ctx={ctx} color={c.accent} />
          <ContactLine ctx={ctx} tone={tone} icons />
          <PersonalInline ctx={ctx} tone={tone} />
        </View>
        <Qr ctx={ctx} size={50} />
        <Photo ctx={ctx} width={74} />
      </View>
      {ctx.sections.map((s) => (
        <SectionView key={s.id} ctx={ctx} section={s} tone={tone} />
      ))}
      <PageFooter ctx={ctx} />
    </Page>
  );
}
