import { Text } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import type { CvCtx } from '../context';
import type { Tone } from '../parts';

export function pageStyle(ctx: CvCtx, extra: Style = {}): Style {
  return {
    fontFamily: ctx.body,
    color: ctx.c.text,
    backgroundColor: ctx.c.paper,
    paddingTop: ctx.pad,
    paddingBottom: ctx.pad + 12,
    paddingHorizontal: ctx.pad,
    fontSize: ctx.fz.base,
    ...extra,
  };
}

export function PersonalInline({ ctx, tone, align = 'left' }: { ctx: CvCtx; tone: Tone; align?: 'left' | 'center' }) {
  if (!ctx.personal.length) return null;
  return <Text style={{ fontSize: ctx.fz.sm, color: tone.muted, marginTop: 4, textAlign: align, lineHeight: 1.4 }}>{ctx.personal.map((r) => `${r.label}: ${r.value}`).join('  ·  ')}</Text>;
}
