import { Page, Text, View } from '@react-pdf/renderer';
import type { Section } from '../../types';
import { hexAlpha, type CvCtx } from '../context';
import { ContactList, PageFooter, paperTone, PersonalList, Photo, Qr, SectionHeading, SectionView } from '../parts';

const SIDE = new Set<Section['type']>(['skills', 'languages', 'hobbies', 'certifications', 'awards', 'training', 'references']);

export function Kreatif({ ctx }: { ctx: CvCtx }) {
  const tone = paperTone(ctx);
  const sideTone = { ...tone, accent: ctx.c.accent };
  const { c, fz, pad } = ctx;
  const side = ctx.sections.filter((s) => SIDE.has(s.type));
  const main = ctx.sections.filter((s) => !SIDE.has(s.type));
  const upper = (t: string) => (ctx.tpl.style.headingCase === 'upper' ? t.toUpperCase() : t);
  return (
    <Page size={ctx.size} style={{ fontFamily: ctx.body, color: c.text, backgroundColor: c.paper, paddingVertical: pad, paddingBottom: pad + 12, paddingHorizontal: pad, fontSize: fz.base }}>
      <View fixed style={{ position: 'absolute', top: 0, left: 0, width: 150, height: 150, borderBottomRightRadius: 150, backgroundColor: hexAlpha(c.accent, 0.14) }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: ctx.sp.section + 4 }}>
        <Photo ctx={ctx} width={92} shape="circle" border={c.accent} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: ctx.head, fontWeight: 700, fontSize: fz.name + 6, color: c.primary, lineHeight: 1.05 }}>{ctx.name || ' '}</Text>
          {ctx.cv.personal.headline.trim() ? (
            <Text
              style={{
                marginTop: 6,
                alignSelf: 'flex-start',
                backgroundColor: c.accent,
                color: '#ffffff',
                fontSize: fz.md,
                fontWeight: 700,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 3,
              }}
            >
              {ctx.cv.personal.headline.trim()}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 22 }}>
        <View style={{ flex: 1 }}>
          {main.map((s) => (
            <SectionView key={s.id} ctx={ctx} section={s} tone={tone} />
          ))}
        </View>
        <View style={{ width: '34%' }}>
          {ctx.contacts.length ? (
            <View style={{ marginBottom: ctx.sp.section }}>
              <SectionHeading ctx={ctx} title={upper(ctx.L.contact)} tone={sideTone} />
              <ContactList ctx={ctx} tone={sideTone} />
            </View>
          ) : null}
          {ctx.personal.length ? (
            <View style={{ marginBottom: ctx.sp.section }}>
              <SectionHeading ctx={ctx} title={upper(ctx.L.personalData)} tone={sideTone} />
              <PersonalList ctx={ctx} tone={sideTone} />
            </View>
          ) : null}
          {side.map((s) => (
            <SectionView key={s.id} ctx={ctx} section={s} tone={sideTone} narrow />
          ))}
          <Qr ctx={ctx} size={60} />
        </View>
      </View>
      <PageFooter ctx={ctx} />
    </Page>
  );
}
