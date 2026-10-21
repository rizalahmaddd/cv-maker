import { Page, View } from '@react-pdf/renderer';
import type { Section } from '../../types';
import { isDark, type CvCtx } from '../context';
import { ContactList, darkTone, Headline, Name, PageFooter, paperTone, PersonalList, Photo, Qr, SectionHeading, SectionView } from '../parts';

const SIDE_TYPES = new Set<Section['type']>(['skills', 'languages', 'hobbies']);

export function Sidebar({ ctx }: { ctx: CvCtx }) {
  const { c, pad } = ctx;
  const dark = isDark(c.side);
  const sideTone = dark ? darkTone() : { ...paperTone(ctx), accent: c.accent };
  const tone = paperTone(ctx);
  const sideW = (ctx.width * Math.min(Math.max(ctx.tpl.style.sideWidth, 26), 40)) / 100;
  const side = ctx.sections.filter((s) => SIDE_TYPES.has(s.type));
  const main = ctx.sections.filter((s) => !SIDE_TYPES.has(s.type));
  const sideHeading = dark ? '#ffffff' : c.primary;
  const contactTitle = ctx.tpl.style.headingCase === 'upper' ? ctx.L.contact.toUpperCase() : ctx.L.contact;
  const personalTitle = ctx.tpl.style.headingCase === 'upper' ? ctx.L.personalData.toUpperCase() : ctx.L.personalData;
  return (
    <Page size={ctx.size} style={{ fontFamily: ctx.body, color: c.text, backgroundColor: c.paper, paddingVertical: pad, paddingBottom: pad + 12, fontSize: ctx.fz.base }}>
      <View fixed style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: sideW, backgroundColor: c.side }} />
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: sideW, paddingHorizontal: Math.min(pad, 24) }}>
          {ctx.photo ? (
            <View style={{ alignItems: 'center', marginBottom: ctx.sp.section }}>
              <Photo ctx={ctx} width={sideW * 0.62} border={dark ? '#ffffff' : undefined} />
            </View>
          ) : null}
          {ctx.contacts.length ? (
            <View style={{ marginBottom: ctx.sp.section }}>
              <SectionHeading ctx={ctx} title={contactTitle} tone={sideTone} color={sideHeading} />
              <ContactList ctx={ctx} tone={sideTone} />
            </View>
          ) : null}
          {ctx.personal.length ? (
            <View style={{ marginBottom: ctx.sp.section }}>
              <SectionHeading ctx={ctx} title={personalTitle} tone={sideTone} color={sideHeading} />
              <PersonalList ctx={ctx} tone={sideTone} />
            </View>
          ) : null}
          {side.map((s) => (
            <SectionView key={s.id} ctx={ctx} section={s} tone={sideTone} narrow headingColor={sideHeading} />
          ))}
          <Qr ctx={ctx} size={56} />
        </View>
        <View style={{ flex: 1, paddingHorizontal: pad - 6 }}>
          <View style={{ marginBottom: ctx.sp.section }}>
            <Name ctx={ctx} color={c.primary} />
            <Headline ctx={ctx} color={c.accent} />
          </View>
          {main.map((s) => (
            <SectionView key={s.id} ctx={ctx} section={s} tone={tone} />
          ))}
        </View>
      </View>
      <PageFooter ctx={ctx} />
    </Page>
  );
}
