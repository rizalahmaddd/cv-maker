import { Font } from '@react-pdf/renderer';
import type { FontKey } from '../types';

import jakarta400 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff?url';
import jakarta600 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff?url';
import jakarta700 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff?url';
import jakarta400i from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-italic.woff?url';
import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import inter600 from '@fontsource/inter/files/inter-latin-600-normal.woff?url';
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff?url';
import inter400i from '@fontsource/inter/files/inter-latin-400-italic.woff?url';
import plex400 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff?url';
import plex600 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff?url';
import plex700 from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff?url';
import plex400i from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-italic.woff?url';
import grotesk400 from '@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff?url';
import grotesk600 from '@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff?url';
import grotesk700 from '@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff?url';
import poppins400 from '@fontsource/poppins/files/poppins-latin-400-normal.woff?url';
import poppins600 from '@fontsource/poppins/files/poppins-latin-600-normal.woff?url';
import poppins700 from '@fontsource/poppins/files/poppins-latin-700-normal.woff?url';
import poppins400i from '@fontsource/poppins/files/poppins-latin-400-italic.woff?url';
import montserrat400 from '@fontsource/montserrat/files/montserrat-latin-400-normal.woff?url';
import montserrat600 from '@fontsource/montserrat/files/montserrat-latin-600-normal.woff?url';
import montserrat700 from '@fontsource/montserrat/files/montserrat-latin-700-normal.woff?url';
import montserrat400i from '@fontsource/montserrat/files/montserrat-latin-400-italic.woff?url';
import outfit400 from '@fontsource/outfit/files/outfit-latin-400-normal.woff?url';
import outfit600 from '@fontsource/outfit/files/outfit-latin-600-normal.woff?url';
import outfit700 from '@fontsource/outfit/files/outfit-latin-700-normal.woff?url';
import lora400 from '@fontsource/lora/files/lora-latin-400-normal.woff?url';
import lora600 from '@fontsource/lora/files/lora-latin-600-normal.woff?url';
import lora700 from '@fontsource/lora/files/lora-latin-700-normal.woff?url';
import lora400i from '@fontsource/lora/files/lora-latin-400-italic.woff?url';
import playfair400 from '@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff?url';
import playfair600 from '@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff?url';
import playfair700 from '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff?url';
import playfair400i from '@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff?url';
import fraunces400 from '@fontsource/fraunces/files/fraunces-latin-400-normal.woff?url';
import fraunces600 from '@fontsource/fraunces/files/fraunces-latin-600-normal.woff?url';
import fraunces700 from '@fontsource/fraunces/files/fraunces-latin-700-normal.woff?url';
import fraunces400i from '@fontsource/fraunces/files/fraunces-latin-400-italic.woff?url';
import dmserif400 from '@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff?url';
import dmserif400i from '@fontsource/dm-serif-display/files/dm-serif-display-latin-400-italic.woff?url';
import mono400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff?url';
import mono600 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff?url';
import mono700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff?url';
import mono400i from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-italic.woff?url';
import spacemono400 from '@fontsource/space-mono/files/space-mono-latin-400-normal.woff?url';
import spacemono700 from '@fontsource/space-mono/files/space-mono-latin-700-normal.woff?url';
import spacemono400i from '@fontsource/space-mono/files/space-mono-latin-400-italic.woff?url';
import helvetica400 from '@fontsource/arimo/files/arimo-latin-400-normal.woff?url';
import helvetica600 from '@fontsource/arimo/files/arimo-latin-600-normal.woff?url';
import helvetica700 from '@fontsource/arimo/files/arimo-latin-700-normal.woff?url';
import helvetica400i from '@fontsource/arimo/files/arimo-latin-400-italic.woff?url';
import times400 from '@fontsource/tinos/files/tinos-latin-400-normal.woff?url';
import times700 from '@fontsource/tinos/files/tinos-latin-700-normal.woff?url';
import times400i from '@fontsource/tinos/files/tinos-latin-400-italic.woff?url';

interface FontFiles {
  regular: string;
  semibold: string;
  bold: string;
  italic: string;
}

// DM Serif Display ships in one weight, Space Grotesk and Outfit have no italic; the nearest file stands in so
// react-pdf never falls back to its built-in Helvetica.
const FILES: Record<FontKey, FontFiles> = {
  jakarta: { regular: jakarta400, semibold: jakarta600, bold: jakarta700, italic: jakarta400i },
  inter: { regular: inter400, semibold: inter600, bold: inter700, italic: inter400i },
  plex: { regular: plex400, semibold: plex600, bold: plex700, italic: plex400i },
  grotesk: { regular: grotesk400, semibold: grotesk600, bold: grotesk700, italic: grotesk400 },
  poppins: { regular: poppins400, semibold: poppins600, bold: poppins700, italic: poppins400i },
  montserrat: { regular: montserrat400, semibold: montserrat600, bold: montserrat700, italic: montserrat400i },
  outfit: { regular: outfit400, semibold: outfit600, bold: outfit700, italic: outfit400 },
  lora: { regular: lora400, semibold: lora600, bold: lora700, italic: lora400i },
  playfair: { regular: playfair400, semibold: playfair600, bold: playfair700, italic: playfair400i },
  fraunces: { regular: fraunces400, semibold: fraunces600, bold: fraunces700, italic: fraunces400i },
  dmserif: { regular: dmserif400, semibold: dmserif400, bold: dmserif400, italic: dmserif400i },
  mono: { regular: mono400, semibold: mono600, bold: mono700, italic: mono400i },
  spacemono: { regular: spacemono400, semibold: spacemono700, bold: spacemono700, italic: spacemono400i },
  helvetica: { regular: helvetica400, semibold: helvetica600, bold: helvetica700, italic: helvetica400i },
  times: { regular: times400, semibold: times700, bold: times700, italic: times400i },
};

const CJK = /[\u3000-\u30ff\u3400-\u9fff\uff00-\uffef]/;

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;
  for (const [key, f] of Object.entries(FILES) as [FontKey, FontFiles][]) {
    Font.register({
      family: key,
      fonts: [
        { src: f.regular, fontWeight: 400 },
        { src: f.semibold, fontWeight: 600 },
        { src: f.bold, fontWeight: 700 },
        { src: f.italic, fontWeight: 400, fontStyle: 'italic' },
      ],
    });
  }
  // Only fetched when a document actually uses it (the Japanese rirekisho), so other users never download it.
  Font.register({
    family: 'notojp',
    fonts: [
      { src: '/fonts/noto-sans-jp-regular.woff', fontWeight: 400 },
      { src: '/fonts/noto-sans-jp-bold.woff', fontWeight: 700 },
    ],
  });
  // Default hyphenation splits Indonesian words at odd places, so Latin wraps on whole words only. Japanese has
  // no spaces, so a CJK run may break between any two characters.
  Font.registerHyphenationCallback((word) => (CJK.test(word) ? Array.from(word) : [word]));
}

export function family(key: FontKey): string {
  return FILES[key] ? key : 'helvetica';
}
