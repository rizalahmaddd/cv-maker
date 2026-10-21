import { Page, View } from '@react-pdf/renderer';
import type { CvCtx } from '../context';
import { ContactLine, Headline, Name, PageFooter, paperTone, SectionView } from '../parts';
import { pageStyle, PersonalInline } from './common';

export function Klasik({ ctx }: { ctx: CvCtx }) {
  const tone = paperTone(ctx);
  const align = ctx.tpl.style.headerAlign;
  return (
    <Page size={ctx.size} style={pageStyle(ctx)}>
      <View style={{ marginBottom: ctx.sp.section, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        <Name ctx={ctx} color={ctx.c.primary} align={align} />
        <Headline ctx={ctx} color={ctx.c.accent} align={align} />
        <ContactLine ctx={ctx} tone={tone} align={align} />
        <PersonalInline ctx={ctx} tone={tone} align={align} />
      </View>
      {ctx.sections.map((s) => (
        <SectionView key={s.id} ctx={ctx} section={s} tone={tone} />
      ))}
      <PageFooter ctx={ctx} />
    </Page>
  );
}
