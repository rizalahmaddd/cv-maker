import { Page, View } from '@react-pdf/renderer';
import { isDark, type CvCtx } from '../context';
import { ContactLine, darkTone, Headline, Name, PageFooter, paperTone, Photo, SectionView } from '../parts';
import { pageStyle, PersonalInline } from './common';

export function Kepala({ ctx }: { ctx: CvCtx }) {
  const { c, pad } = ctx;
  const tone = paperTone(ctx);
  const band = isDark(c.primary) ? darkTone() : { ...tone, accent: c.text };
  return (
    <Page size={ctx.size} style={pageStyle(ctx)}>
      <View
        style={{
          marginTop: -pad,
          marginHorizontal: -pad,
          marginBottom: ctx.sp.section + 2,
          backgroundColor: c.primary,
          paddingHorizontal: pad,
          paddingVertical: pad * 0.8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <Photo ctx={ctx} width={78} shape={ctx.tpl.style.photoShape} border={band.text} />
        <View style={{ flex: 1 }}>
          <Name ctx={ctx} color={band.text} />
          <Headline ctx={ctx} color={band.muted} />
          <ContactLine ctx={ctx} tone={band} icons />
          <PersonalInline ctx={ctx} tone={band} />
        </View>
      </View>
      {ctx.sections.map((s) => (
        <SectionView key={s.id} ctx={ctx} section={s} tone={tone} />
      ))}
      <PageFooter ctx={ctx} />
    </Page>
  );
}
