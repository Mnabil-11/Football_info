import { useEffect } from 'react';

const SITE_NAME = 'متتبع كرة القدم';

/**
 * Sets a per-page <title>. Unlike Open Graph tags (only read by crawlers
 * that fetch raw HTML), the title tag is visible to any crawler that
 * executes JavaScript — including Googlebot — so this is real, working SEO
 * for a client-rendered SPA, even without server rendering.
 */
export const useDocumentTitle = (title?: string): void => {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  }, [title]);
};
