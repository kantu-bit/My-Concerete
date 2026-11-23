import { useEffect } from 'react';

interface SeoOptions {
  title: string;
  description: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function useDocumentMeta({ title, description, jsonLd }: SeoOptions) {
  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:image"]', 'property', 'og:image', `${window.location.origin}/images/home/og-image.jpg`);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', `${window.location.origin}/images/home/og-image.jpg`);

    const existingCanon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const url = window.location.origin + window.location.pathname;
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    if (existingCanon) {
      existingCanon.href = url;
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = url;
      document.head.appendChild(link);
    }

    const scriptId = 'dynamic-jsonld';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) existingScript.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, jsonLd]);
}
