import { Circle, Image, Link, Path, Svg, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import type { Entry, Section } from '../types';
import { parseDetails } from '../lib/text';
import { LANGUAGE_LEVELS, SECTION_DEFS } from '../presets/sections';
import { hexAlpha, type Contact, type CvCtx } from './context';

export interface Tone {
  text: string;
  muted: string;
  accent: string;
  line: string;
}

export function paperTone(ctx: CvCtx): Tone {
  return { text: ctx.c.text, muted: ctx.c.muted, accent: ctx.c.accent, line: hexAlpha(ctx.c.text, 0.18) };
}

export function darkTone(): Tone {
  return { text: '#ffffff', muted: '#d6dae0', accent: '#ffffff', line: 'rgba(255,255,255,0.35)' };
}

export function ContactIcon({ kind, color, size = 8 }: { kind: Contact['kind']; color: string; size?: number }) {
  const common = { stroke: color, strokeWidth: 2, fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {kind === 'email' && (
        <>
          <Path d="M3 5h18v14H3z" {...common} />
          <Path d="M3 6l9 7 9-7" {...common} />
        </>
      )}
      {kind === 'phone' && <Path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" {...common} />}
      {kind === 'location' && (
        <>
          <Path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" {...common} />
          <Circle cx="12" cy="9" r="2.5" {...common} />
        </>
      )}
      {kind === 'link' && (
        <>
          <Path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" {...common} />
          <Path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" {...common} />
        </>
      )}
    </Svg>
  );
}

function ContactText({ ctx, c, color }: { ctx: CvCtx; c: Contact; color: string }) {
  const style: Style = { color, textDecoration: 'none', fontSize: ctx.fz.sm };
  return c.href ? (
    <Link src={c.href} style={style}>
      {c.text}
    </Link>
  ) : (
    <Text style={style}>{c.text}</Text>
  );
}

export function ContactLine({ ctx, tone, align = 'left', icons }: { ctx: CvCtx; tone: Tone; align?: 'left' | 'center'; icons?: boolean }) {
  if (!ctx.contacts.length) return null;
  const showIcons = icons ?? ctx.tpl.style.icons;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', marginTop: 5, rowGap: 2 }}>
      {ctx.contacts.map((c, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
          {i > 0 && !showIcons ? <Text style={{ color: tone.muted, fontSize: ctx.fz.sm, marginHorizontal: 5 }}>|</Text> : null}
          {showIcons ? (
            <View style={{ marginRight: 3, marginLeft: i > 0 ? 9 : 0 }}>
              <ContactIcon kind={c.kind} color={tone.accent} />
            </View>
          ) : null}
          <ContactText ctx={ctx} c={c} color={tone.text} />
        </View>
      ))}
    </View>
  );
}

export function ContactList({ ctx, tone }: { ctx: CvCtx; tone: Tone }) {
  return (
    <View style={{ gap: 5 }}>
      {ctx.contacts.map((c, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
          <View style={{ marginTop: 1.5 }}>
            <ContactIcon kind={c.kind} color={tone.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <ContactText ctx={ctx} c={c} color={tone.text} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function Photo({ ctx, width, ratio = 4 / 3, shape, border }: { ctx: CvCtx; width: number; ratio?: number; shape?: CvCtx['tpl']['style']['photoShape']; border?: string }) {
  if (!ctx.photo) return null;
  const s = shape ?? ctx.tpl.style.photoShape;
  const height = s === 'circle' ? width : width * ratio;
  const radius = s === 'circle' ? width / 2 : s === 'rounded' ? 6 : 0;
  return (
    <View style={{ width, height, borderRadius: radius, overflow: 'hidden', borderWidth: border ? 2 : 0, borderColor: border }}>
      <Image src={ctx.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </View>
  );
}

export function SectionHeading({ ctx, title, tone, color }: { ctx: CvCtx; title: string; tone: Tone; color?: string }) {
  const { fz, tpl } = ctx;
  const ink = color ?? ctx.c.primary;
  const text: Style = { fontFamily: ctx.head, fontWeight: 700, fontSize: fz.md, color: ink, letterSpacing: tpl.style.headingCase === 'upper' ? 0.8 : 0.2 };
  const wrap: Style = { marginBottom: ctx.sp.entry - 2 };
  switch (tpl.style.heading) {
    case 'block':
      return (
        <View style={{ ...wrap, backgroundColor: ink, paddingVertical: 3, paddingHorizontal: 6 }}>
          <Text style={{ ...text, color: '#ffffff' }}>{title}</Text>
        </View>
      );
    case 'underline':
      return (
        <View style={wrap}>
          <Text style={text}>{title}</Text>
          <View style={{ width: 28, height: 2, backgroundColor: ctx.c.accent, marginTop: 3 }} />
        </View>
      );
    case 'bar':
      return (
        <View style={{ ...wrap, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 3, height: fz.md + 2, backgroundColor: ctx.c.accent }} />
          <Text style={text}>{title}</Text>
        </View>
      );
    case 'plain':
      return (
        <View style={wrap}>
          <Text style={text}>{title}</Text>
        </View>
      );
    default:
      return (
        <View style={{ ...wrap, borderBottomWidth: 0.8, borderBottomColor: color ? tone.line : hexAlpha(ink, 0.5), paddingBottom: 2 }}>
          <Text style={text}>{title}</Text>
        </View>
      );
  }
}

export function Details({ ctx, text, tone }: { ctx: CvCtx; text: string; tone: Tone }) {
  const { paragraphs, bullets } = parseDetails(text);
  if (!paragraphs.length && !bullets.length) return null;
  const body: Style = { fontSize: ctx.fz.base, lineHeight: ctx.sp.line, color: tone.text };
  return (
    <View style={{ marginTop: 2 }}>
      {paragraphs.map((p, i) => (
        <Text key={`p${i}`} style={{ ...body, marginBottom: ctx.sp.para }}>
          {p}
        </Text>
      ))}
      {bullets.map((b, i) => (
        <View key={`b${i}`} style={{ flexDirection: 'row', marginBottom: 1 }}>
          <Text style={{ ...body, width: 9, color: tone.muted }}>•</Text>
          <Text style={{ ...body, flex: 1 }}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function Meta({ ctx, parts, tone }: { ctx: CvCtx; parts: string[]; tone: Tone }) {
  const shown = parts.map((p) => p.trim()).filter(Boolean);
  if (!shown.length) return null;
  return <Text style={{ fontSize: ctx.fz.sm, color: tone.muted, marginTop: 1, lineHeight: 1.3 }}>{shown.join(' · ')}</Text>;
}

// Short entries never split across pages; long ones may, so a single huge job can't push a blank half page.
export function EntryBlock({ ctx, entry, section, tone, datePosition }: { ctx: CvCtx; entry: Entry; section: Section; tone: Tone; datePosition?: 'right' | 'below' | 'left' }) {
  const { fz } = ctx;
  const def = SECTION_DEFS[section.type];
  const date = def.fields.range ? ctx.range(entry, section.type) : '';
  const pos = datePosition ?? ctx.tpl.style.datePosition;
  const titleStyle: Style = { fontFamily: ctx.head, fontWeight: 700, fontSize: fz.md, color: tone.text, lineHeight: 1.3 };
  const dateStyle: Style = { fontSize: fz.sm, color: tone.muted, lineHeight: 1.3 };
  const subtitle = def.fields.subtitle ? entry.subtitle : '';
  const location = def.fields.location ? entry.location : '';
  const title = entry.title.trim() || subtitle.trim();
  const metaParts = entry.title.trim() ? [subtitle, location] : [location];
  return (
    <View wrap={lineCount(entry.details) > 8} style={{ marginBottom: ctx.sp.entry }}>
      {pos === 'right' ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ ...titleStyle, flex: 1 }}>{title}</Text>
          {date ? <Text style={{ ...dateStyle, flexShrink: 0, maxWidth: '40%', textAlign: 'right', marginTop: 1 }}>{date}</Text> : null}
        </View>
      ) : (
        <Text style={titleStyle}>{title}</Text>
      )}
      {entry.title.trim() && subtitle.trim() ? (
        <Text style={{ fontSize: fz.base, color: tone.accent, fontWeight: 600, marginTop: 1 }}>{[subtitle, location].filter((x) => x.trim()).join(' · ')}</Text>
      ) : (
        <Meta ctx={ctx} parts={metaParts} tone={tone} />
      )}
      {pos === 'below' && date ? <Text style={{ ...dateStyle, marginTop: 1 }}>{date}</Text> : null}
      {def.fields.extra && entry.extra.trim() ? <Text style={{ fontSize: fz.sm, color: tone.muted, marginTop: 1 }}>{entry.extra}</Text> : null}
      {def.fields.link && entry.link.trim() ? (
        <Link src={/^https?:/i.test(entry.link) ? entry.link : `https://${entry.link}`} style={{ fontSize: fz.sm, color: tone.accent, textDecoration: 'none', marginTop: 1 }}>
          {entry.link.replace(/^https?:\/\//, '')}
        </Link>
      ) : null}
      {def.fields.details ? <Details ctx={ctx} text={entry.details} tone={tone} /> : null}
    </View>
  );
}

function Dots({ level, tone, size = 5 }: { level: number; tone: Tone; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2.5 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: i <= level ? tone.accent : tone.line }} />
      ))}
    </View>
  );
}

function Bar({ level, tone }: { level: number; tone: Tone }) {
  return (
    <View style={{ height: 3.5, borderRadius: 2, backgroundColor: tone.line, marginTop: 2 }}>
      <View style={{ height: 3.5, borderRadius: 2, width: `${(Math.min(Math.max(level, 0), 5) / 5) * 100}%`, backgroundColor: tone.accent }} />
    </View>
  );
}

function groupBy(entries: Entry[]): [string, Entry[]][] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const k = e.subtitle.trim();
    map.set(k, [...(map.get(k) ?? []), e]);
  }
  return [...map.entries()];
}

export function SkillsBlock({ ctx, section, tone, narrow }: { ctx: CvCtx; section: Section; tone: Tone; narrow?: boolean }) {
  const { fz } = ctx;
  const style = ctx.tpl.style.skills;
  const entries = section.entries;
  const body: Style = { fontSize: fz.base, color: tone.text, lineHeight: ctx.sp.line };
  const groups = groupBy(entries);
  const label = (g: string) => (g ? <Text style={{ fontWeight: 700 }}>{g}: </Text> : null);
  if (style === 'tags') {
    return (
      <View style={{ gap: 5 }}>
        {groups.map(([g, list]) => (
          <View key={g}>
            {g ? <Text style={{ ...body, fontWeight: 700, fontSize: fz.sm, marginBottom: 2 }}>{g}</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
              {list.map((e) => (
                <Text key={e.id} style={{ fontSize: fz.sm, color: tone.text, borderWidth: 0.7, borderColor: tone.line, borderRadius: 3, paddingVertical: 1.5, paddingHorizontal: 4 }}>
                  {e.title}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }
  if ((style === 'dots' || style === 'bars') && entries.some((e) => e.level > 0)) {
    return (
      <View style={{ flexDirection: narrow ? 'column' : 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 }}>
        {entries.map((e) => (
          <View key={e.id} wrap={false} style={{ width: narrow ? '100%' : '46%' }}>
            {style === 'dots' ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <Text style={{ ...body, flex: 1 }}>{e.title}</Text>
                {e.level > 0 ? <Dots level={e.level} tone={tone} /> : null}
              </View>
            ) : (
              <>
                <Text style={body}>{e.title}</Text>
                {e.level > 0 ? <Bar level={e.level} tone={tone} /> : null}
              </>
            )}
          </View>
        ))}
      </View>
    );
  }
  if (narrow && groups.length <= 1) {
    return (
      <View style={{ gap: 2 }}>
        {entries.map((e) => (
          <Text key={e.id} style={body}>
            {e.title}
          </Text>
        ))}
      </View>
    );
  }
  return (
    <View style={{ gap: 2 }}>
      {groups.map(([g, list]) => (
        <Text key={g} style={body}>
          {label(g)}
          {list.map((e) => e.title).join(', ')}
        </Text>
      ))}
    </View>
  );
}

export function LanguagesBlock({ ctx, section, tone, narrow }: { ctx: CvCtx; section: Section; tone: Tone; narrow?: boolean }) {
  const { fz } = ctx;
  const style = ctx.tpl.style.skills;
  const lang = ctx.cv.lang;
  const body: Style = { fontSize: fz.base, color: tone.text, lineHeight: ctx.sp.line };
  return (
    <View style={{ flexDirection: narrow ? 'column' : 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 3 }}>
      {section.entries.map((e) => {
        const level = e.subtitle.trim() || (e.level ? LANGUAGE_LEVELS[lang][e.level] : '');
        const visual = (style === 'dots' || style === 'bars') && e.level > 0;
        return (
          <View key={e.id} wrap={false} style={{ width: narrow ? '100%' : '46%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
              <Text style={{ ...body, flex: 1 }}>
                <Text style={{ fontWeight: 600 }}>{e.title}</Text>
                {level && !visual ? <Text style={{ color: tone.muted }}> · {level}</Text> : null}
              </Text>
              {visual && style === 'dots' ? <Dots level={e.level} tone={tone} /> : null}
            </View>
            {visual && style === 'bars' ? <Bar level={e.level} tone={tone} /> : null}
            {visual && level ? <Text style={{ fontSize: fz.sm, color: tone.muted }}>{level}</Text> : null}
            {e.extra.trim() ? <Text style={{ fontSize: fz.sm, color: tone.muted }}>{e.extra}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function lineCount(text: string) {
  return text.split('\n').filter((l) => l.trim()).length;
}

// A heading is glued to its first entry (or to a short section as a whole), so a title never ends up alone at
// the bottom of a page. react-pdf's minPresenceAhead does not reliably prevent that on its own.
export function SectionView({
  ctx,
  section,
  tone,
  narrow,
  headingColor,
  datePosition,
}: {
  ctx: CvCtx;
  section: Section;
  tone: Tone;
  narrow?: boolean;
  headingColor?: string;
  datePosition?: 'right' | 'below' | 'left';
}) {
  const def = SECTION_DEFS[section.type];
  const heading = <SectionHeading ctx={ctx} title={ctx.title(section)} tone={tone} color={headingColor} />;
  const pos = narrow ? 'below' : datePosition;
  if (def.kind === 'entries') {
    const [first, ...rest] = section.entries;
    const glue = lineCount(first.details) <= 8;
    return (
      <View style={{ marginBottom: ctx.sp.section - ctx.sp.entry }}>
        <View wrap={!glue}>
          {heading}
          <EntryBlock ctx={ctx} entry={first} section={section} tone={tone} datePosition={pos} />
        </View>
        {rest.map((e) => (
          <EntryBlock key={e.id} ctx={ctx} entry={e} section={section} tone={tone} datePosition={pos} />
        ))}
      </View>
    );
  }
  const small = def.kind === 'text' ? section.text.length < 900 : section.entries.length <= 16;
  return (
    <View wrap={!small} style={{ marginBottom: ctx.sp.section }}>
      {heading}
      <SectionBody ctx={ctx} section={section} tone={tone} narrow={narrow} />
    </View>
  );
}

export function SectionBody({ ctx, section, tone, narrow }: { ctx: CvCtx; section: Section; tone: Tone; narrow?: boolean }) {
  const def = SECTION_DEFS[section.type];
  if (def.kind === 'text') return <Details ctx={ctx} text={section.text} tone={tone} />;
  if (section.type === 'skills') return <SkillsBlock ctx={ctx} section={section} tone={tone} narrow={narrow} />;
  if (section.type === 'languages') return <LanguagesBlock ctx={ctx} section={section} tone={tone} narrow={narrow} />;
  return <Text style={{ fontSize: ctx.fz.base, color: tone.text, lineHeight: ctx.sp.line }}>{section.entries.map((e) => e.title).join(narrow ? '\n' : ', ')}</Text>;
}

export function PersonalTable({ ctx, tone, withName, withContacts, labelWidth = 120 }: { ctx: CvCtx; tone: Tone; withName?: boolean; withContacts?: boolean; labelWidth?: number }) {
  const { L, fz } = ctx;
  const p = ctx.cv.personal;
  const rows: { label: string; value: string }[] = [];
  if (withName && ctx.name) rows.push({ label: L.name, value: ctx.name });
  rows.push(...ctx.personal);
  if (withContacts) {
    if (p.phone.trim()) rows.push({ label: L.phone, value: p.phone.trim() });
    if (p.email.trim()) rows.push({ label: L.email, value: p.email.trim() });
    const loc = ctx.contacts.find((x) => x.kind === 'location');
    if (loc && !ctx.personal.some((r) => r.key === 'address')) rows.push({ label: L.location, value: loc.text });
    for (const l of ctx.contacts) if (l.kind === 'link') rows.push({ label: l.label ?? L.links, value: l.text });
  }
  if (!rows.length) return null;
  return (
    <View style={{ gap: 2 }}>
      {rows.map((r, i) => (
        <View key={i} wrap={false} style={{ flexDirection: 'row' }}>
          <Text style={{ width: labelWidth, fontSize: fz.base, color: tone.muted }}>{r.label}</Text>
          <Text style={{ width: 10, fontSize: fz.base, color: tone.muted }}>:</Text>
          <Text style={{ flex: 1, fontSize: fz.base, color: tone.text, lineHeight: 1.35 }}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function PersonalList({ ctx, tone }: { ctx: CvCtx; tone: Tone }) {
  if (!ctx.personal.length) return null;
  return (
    <View style={{ gap: 4 }}>
      {ctx.personal.map((r, i) => (
        <View key={i} wrap={false}>
          <Text style={{ fontSize: ctx.fz.xs, color: tone.muted }}>{r.label}</Text>
          <Text style={{ fontSize: ctx.fz.sm, color: tone.text, lineHeight: 1.3 }}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function Qr({ ctx, size = 48 }: { ctx: CvCtx; size?: number }) {
  if (!ctx.qr) return null;
  return <Image src={ctx.qr} style={{ width: size, height: size }} />;
}

export function PageFooter({ ctx, color }: { ctx: CvCtx; color?: string }) {
  return (
    <Text
      fixed
      style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: ctx.fz.xs, color: color ?? ctx.c.muted }}
      render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${ctx.name ? `${ctx.name} · ` : ''}${ctx.L.page} ${pageNumber} ${ctx.L.of} ${totalPages}` : '')}
    />
  );
}

export function Name({ ctx, color, align = 'left', size }: { ctx: CvCtx; color: string; align?: 'left' | 'center'; size?: number }) {
  return <Text style={{ fontFamily: ctx.head, fontWeight: 700, fontSize: size ?? ctx.fz.name, color, lineHeight: 1.15, textAlign: align }}>{ctx.name || ' '}</Text>;
}

export function Headline({ ctx, color, align = 'left' }: { ctx: CvCtx; color: string; align?: 'left' | 'center' }) {
  const h = ctx.cv.personal.headline.trim();
  if (!h) return null;
  return <Text style={{ fontSize: ctx.fz.lg, color, marginTop: 3, textAlign: align, fontWeight: 600 }}>{h}</Text>;
}
