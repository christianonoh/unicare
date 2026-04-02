import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface PageMeta {
  pathname: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbLabel?: string;
}

interface PageMetaState {
  meta: PageMeta | null;
  setMeta: (meta: PageMeta) => void;
  clearMeta: (pathname: string) => void;
}

export const usePageMetaStore = create<PageMetaState>()((set) => ({
  meta: null,
  setMeta: (meta) => set({ meta }),
  clearMeta: (pathname) =>
    set((state) => ({
      meta: state.meta?.pathname === pathname ? null : state.meta,
    })),
}));
