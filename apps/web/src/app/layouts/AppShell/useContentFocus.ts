import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

export function useContentFocus() {
  const { pathname } = useLocation();
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => { contentRef.current?.focus(); }, [pathname]);
  return contentRef;
}
