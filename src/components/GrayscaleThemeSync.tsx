'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function GrayscaleThemeSync({ initialIsGrayscale }: { initialIsGrayscale: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
    document.body.classList.toggle('grayscale', initialIsGrayscale && !isAdminRoute);

    const syncTheme = async () => {
      try {
        const response = await fetch('/api/theme', { cache: 'no-store', credentials: 'omit' });
        if (!response.ok) return;
        const settings = await response.json();
        if (active) document.body.classList.toggle('grayscale', Boolean(settings.isGrayscale) && !isAdminRoute);
      } catch {
        // Keep the server-rendered theme when the settings endpoint is unavailable.
      }
    };

    if (isAdminRoute) {
      return () => { active = false; };
    }

    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') void syncTheme();
    };

    void syncTheme();
    window.addEventListener('focus', syncWhenVisible);
    document.addEventListener('visibilitychange', syncWhenVisible);
    return () => {
      active = false;
      window.removeEventListener('focus', syncWhenVisible);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [initialIsGrayscale, pathname]);

  return null;
}