import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const IconDoc = (p: P) => (
  <Svg {...p}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M14 3v5h5M9 13h7M9 17h4" />
  </Svg>
);
export const IconPeople = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c.6-3.6 2.8-5.5 5.5-5.5s4.9 1.9 5.5 5.5" />
    <path d="M15.5 5.2a3 3 0 0 1 0 5.6M17.5 14.8c1.6.6 2.6 2.3 3 5.2" />
  </Svg>
);
export const IconLayout = (p: P) => (
  <Svg {...p}>
    <path d="M4 3h16v18H4z" />
    <path d="M4 8h16M10 8v13" />
  </Svg>
);
export const IconGear = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
  </Svg>
);
export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />
  </Svg>
);
export const IconCopy = (p: P) => (
  <Svg {...p}>
    <path d="M8 8h12v12H8z" />
    <path d="M16 8V4H4v12h4" />
  </Svg>
);
export const IconShare = (p: P) => (
  <Svg {...p}>
    <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
    <path d="M5 12v9h14v-9" />
  </Svg>
);
export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14" />
  </Svg>
);
export const IconEdit = (p: P) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="m13 7 4 4" />
  </Svg>
);
export const IconBack = (p: P) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const IconChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);
export const IconUp = (p: P) => (
  <Svg {...p}>
    <path d="m6 15 6-6 6 6" />
  </Svg>
);
export const IconClose = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const IconUpload = (p: P) => (
  <Svg {...p}>
    <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M5 20h14" />
  </Svg>
);
export const IconWallet = (p: P) => (
  <Svg {...p}>
    <path d="M3 7h16v13H3z" />
    <path d="M3 7l12-4v4M15 13.5h2" />
  </Svg>
);
export const IconReceipt = (p: P) => (
  <Svg {...p}>
    <path d="M5 3h14v18l-2.3-1.6L14.3 21 12 19.4 9.7 21l-2.4-1.6L5 21z" />
    <path d="M9 8h6M9 12h6" />
  </Svg>
);
export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Svg>
);
export const IconMore = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} strokeLinecap="round" />
  </Svg>
);
export const IconSun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Svg>
);
export const IconMoon = (p: P) => (
  <Svg {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);
export const IconTable = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M3 15h18M9 10v10M15 10v10" />
  </Svg>
);
export const IconGrid = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </Svg>
);
export const IconZoomIn = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
  </Svg>
);
export const IconZoomOut = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5M8 11h6" />
  </Svg>
);
export const IconPrinter = (p: P) => (
  <Svg {...p}>
    <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="7" rx="1" />
  </Svg>
);
export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);
export const IconFilter = (p: P) => (
  <Svg {...p}>
    <path d="M3 5h18M6 12h12M10 19h4" />
  </Svg>
);
export const IconSidebar = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </Svg>
);

export const IconChart = (p: P) => (
  <Svg {...p}>
    <path d="M4 20h16M7 16v-5M12 16V6M17 16v-8" />
  </Svg>
);
export const IconDrag = (p: P) => (
  <Svg {...p}>
    <path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" strokeWidth={3} strokeLinecap="round" />
  </Svg>
);
export const IconEye = (p: P) => (
  <Svg {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
export const IconEyeOff = (p: P) => (
  <Svg {...p}>
    <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);
export const IconUser = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c.8-4.4 3.8-7 8-7s7.2 2.6 8 7" />
  </Svg>
);
export const IconCamera = (p: P) => (
  <Svg {...p}>
    <path d="M3 7h4l2-3h6l2 3h4v13H3z" />
    <circle cx="12" cy="13" r="4" />
  </Svg>
);
export const IconWarning = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l10 18H2z" />
    <path d="M12 10v5M12 18h.01" />
  </Svg>
);
export const IconInfo = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7h.01" />
  </Svg>
);
export const IconLetter = (p: P) => (
  <Svg {...p}>
    <path d="M3 5h18v14H3z" />
    <path d="M3 6l9 7 9-7" />
  </Svg>
);
export const IconBriefcase = (p: P) => (
  <Svg {...p}>
    <path d="M3 7h18v13H3zM9 7V4h6v3M3 12h18" />
  </Svg>
);
export const IconImage = (p: P) => (
  <Svg {...p}>
    <path d="M3 4h18v16H3z" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 16l-5-5-9 9" />
  </Svg>
);
export const IconWand = (p: P) => (
  <Svg {...p}>
    <path d="M4 20L15 9M14 4v3M19 9h-3M18 5l-2 2M11 4l.5 1.5M20 13l-1.5-.5" />
  </Svg>
);
export const IconUndo = (p: P) => (
  <Svg {...p}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
  </Svg>
);
export const IconRedo = (p: P) => (
  <Svg {...p}>
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H9a5 5 0 0 0 0 10h4" />
  </Svg>
);
export const IconSort = (p: P) => (
  <Svg {...p}>
    <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />
  </Svg>
);
