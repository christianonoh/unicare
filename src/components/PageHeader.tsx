import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usePageMetaStore } from '../app/store/pageMetaStore';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  breadcrumbLabel?: string;
}

export function PageHeader({ title, description, actions, breadcrumbLabel }: PageHeaderProps) {
  const location = useLocation();
  const setMeta = usePageMetaStore((state) => state.setMeta);
  const clearMeta = usePageMetaStore((state) => state.clearMeta);

  useLayoutEffect(() => {
    setMeta({
      pathname: location.pathname,
      title,
      description,
      actions,
      breadcrumbLabel,
    });

    return () => clearMeta(location.pathname);
  }, [actions, breadcrumbLabel, clearMeta, description, location.pathname, setMeta, title]);

  return null;
}
