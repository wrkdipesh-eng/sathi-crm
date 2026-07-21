'use client';

import { useEffect } from 'react';

export default function BrandingSyncer() {
  useEffect(() => {
    const syncBranding = async () => {
      try {
        const res = await fetch('/api/branding');
        if (res.ok) {
          const data = await res.json();
          if (data.organization) {
            const { faviconUrl, titleTag } = data.organization;

            if (faviconUrl) {
              localStorage.setItem('organization_favicon_url', faviconUrl);
              let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
              if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
              }
              if (link.href !== faviconUrl) {
                link.href = faviconUrl;
              }
            } else {
              localStorage.removeItem('organization_favicon_url');
            }

            if (titleTag) {
              localStorage.setItem('organization_title_tag', titleTag);
              if (document.title !== titleTag) {
                document.title = titleTag;
              }
            } else {
              localStorage.removeItem('organization_title_tag');
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync branding:', err);
      }
    };

    syncBranding();
  }, []);

  return null;
}
