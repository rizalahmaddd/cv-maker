import { createContext } from 'react';
import type { Lang } from '../types';

export const EditorCtx = createContext<{ lang: Lang; undo: () => void }>({ lang: 'id', undo: () => {} });
