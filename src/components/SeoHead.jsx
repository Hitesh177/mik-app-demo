import { useEffect } from 'react';

function setMeta(name, content, attr = 'name') {
  if (typeof document === 'undefined') return null;
  const selector = attr === 'property' ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content || '');
  return tag;
}

export default function SeoHead({
  title,
  description,
  canonical,
  keywords,
  image,
  jsonLd,
  ogType = 'website',
  robots = 'index,follow',
}) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const previousTitle = document.title;
    const oldCanonical = document.head.querySelector('link[rel="canonical"]');
    let canonicalTag = oldCanonical;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    if (jsonLd) script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    document.title = title || previousTitle;
    setMeta('description', description || '');
    setMeta('keywords', keywords || '');
    setMeta('robots', robots);
    setMeta('og:title', title || '', 'property');
    setMeta('og:description', description || '', 'property');
    setMeta('og:type', ogType, 'property');
    setMeta('og:url', canonical || window.location.href, 'property');
    setMeta('og:site_name', 'MIK Store', 'property');
    if (image) setMeta('og:image', image, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title || '');
    setMeta('twitter:description', description || '');
    if (image) setMeta('twitter:image', image);

    if (canonical) canonicalTag.setAttribute('href', canonical);

    return () => {
      document.title = previousTitle;
      script.remove();
    };
  }, [title, description, canonical, keywords, image, jsonLd, ogType, robots]);

  return null;
}
