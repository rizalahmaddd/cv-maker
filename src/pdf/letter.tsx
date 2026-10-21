import { Document, Image, Page, pdf, Text, View } from '@react-pdf/renderer';
import type { Cv, Letter, TemplateConfig } from '../types';
import { buildCtx, isDark, type CvCtx } from './context';
import { registerFonts } from './fonts';
import { ContactLine, darkTone, paperTone } from './parts';
import { formatDay } from '../lib/dates';
import { letterBlocks } from '../lib/letter';
import { pdfSafe } from '../lib/text';

function Header({ ctx }: { ctx: CvCtx }) {
  const { c, fz } = ctx;
  const band = ctx.tpl.layout === 'kepala' || ctx.tpl.layout === 'sidebar';
  const tone = band && isDark(c.primary) ? darkTone() : paperTone(ctx);
  const center = ctx.tpl.style.headerAlign === 'center' || ctx.tpl.layout === 'drh';
  return (
    <View
      style={
        band
          ? { marginTop: -ctx.pad, marginHorizontal: -ctx.pad, padding: ctx.pad * 0.7, paddingHorizontal: ctx.pad, backgroundColor: c.primary, marginBottom: 22 }
          : { paddingBottom: 10, borderBottomWidth: 1.2, borderBottomColor: c.primary, marginBottom: 22, alignItems: center ? 'center' : 'flex-start' }
      }
    >
      <Text style={{ fontFamily: ctx.head, fontWeight: 700, fontSize: fz.xl + 3, color: band ? tone.text : c.primary }}>{ctx.name || ' '}</Text>
      {ctx.cv.personal.headline.trim() ? <Text style={{ fontSize: fz.base, color: band ? tone.muted : c.accent, marginTop: 2 }}>{ctx.cv.personal.headline.trim()}</Text> : null}
      <ContactLine ctx={ctx} tone={tone} align={center && !band ? 'center' : 'left'} />
    </View>
  );
}

export function LetterDocument({ ctx, letter, signature }: { ctx: CvCtx; letter: Letter; signature?: string }) {
  const { fz, c } = ctx;
  const id = letter.lang === 'id';
  const l = Object.fromEntries(Object.entries(letter).map(([k, v]) => [k, typeof v === 'string' ? pdfSafe(v) : v])) as Letter;
  const body = { fontSize: fz.base + 1, lineHeight: 1.55, color: c.text };
  const dateLine = [l.place.trim(), l.date ? formatDay(l.date, l.lang) : ''].filter(Boolean).join(', ');
  const attachCount = l.attachments.filter((a) => a.trim()).length;
  const recipient = [l.recipient, l.recipientTitle, l.company, l.companyAddress].map((x) => x.trim()).filter(Boolean);
  return (
    <Document title={l.subject || 'Surat Lamaran'} author={ctx.name || undefined} creator="CV Maker" producer="CV Maker" language={l.lang}>
      <Page size={ctx.size} style={{ fontFamily: ctx.body, color: c.text, backgroundColor: c.paper, padding: ctx.pad + 6, paddingBottom: ctx.pad + 14 }}>
        <Header ctx={ctx} />
        {id ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
            <View>
              {l.subject.trim() ? (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ ...body, width: 62 }}>Perihal</Text>
                  <Text style={body}>: {l.subject}</Text>
                </View>
              ) : null}
              {attachCount ? (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ ...body, width: 62 }}>Lampiran</Text>
                  <Text style={body}>: {attachCount} berkas</Text>
                </View>
              ) : null}
            </View>
            <Text style={body}>{dateLine}</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 14 }}>
            <Text style={body}>{dateLine}</Text>
          </View>
        )}
        {recipient.length ? (
          <View style={{ marginBottom: 14 }}>
            {id ? <Text style={body}>Kepada Yth.</Text> : null}
            {recipient.map((r, i) => (
              <Text key={i} style={{ ...body, fontWeight: i === 0 || r === l.company.trim() ? 700 : 400 }}>
                {r}
              </Text>
            ))}
            {id ? <Text style={body}>di tempat</Text> : null}
          </View>
        ) : null}
        {!id && l.subject.trim() ? <Text style={{ ...body, fontWeight: 700, marginBottom: 10 }}>Re: {l.subject}</Text> : null}
        <Text style={{ ...body, marginBottom: 8 }}>{l.salutation}</Text>
        {letterBlocks(l, ctx.cv).map((b, i) =>
          b.kind === 'p' ? (
            <Text key={i} style={{ ...body, marginBottom: 8, textAlign: 'justify' }}>
              {b.text}
            </Text>
          ) : (
            <View key={i} style={{ marginBottom: 8, paddingLeft: 14 }}>
              {b.items.map((it, j) => (
                <View key={j} style={{ flexDirection: 'row' }} wrap={false}>
                  <Text style={{ ...body, width: 18 }}>{j + 1}.</Text>
                  <Text style={{ ...body, flex: 1 }}>{it}</Text>
                </View>
              ))}
            </View>
          ),
        )}
        <View wrap={false} style={{ marginTop: 10, width: 200 }}>
          <Text style={body}>{l.closing}</Text>
          <View style={{ height: 58, justifyContent: 'center' }}>{signature ? <Image src={signature} style={{ height: 50, objectFit: 'contain', objectPosition: 'left' }} /> : null}</View>
          <Text style={{ ...body, fontWeight: 700 }}>{ctx.name || ' '}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderLetterPdf(letter: Letter, cv: Cv, tpl: TemplateConfig, signature?: string): Promise<Blob> {
  registerFonts();
  const ctx = buildCtx({ ...cv, lang: letter.lang }, tpl);
  return pdf(<LetterDocument ctx={ctx} letter={letter} signature={signature} />).toBlob();
}
