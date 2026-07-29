import { useEffect } from 'react';

/**
 * Injects a <script type="application/ld+json"> tag with the given
 * structured-data object, removing it on unmount/data change. Same caveat as
 * meta tags: only crawlers that execute JS (e.g. Googlebot) see this, since
 * the app has no server rendering.
 */
export const useJsonLd = (data: object | null): void => {
  useEffect(() => {
    if (!data) {
      return;
    }
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [data]);
};
