import { useEffect, useState } from 'react';

function wixVariant(src, width) {
  if (!src?.includes('static.wixstatic.com/media/')) return src;
  if (/\/v1\/(?:fit|fill)\//.test(src)) return src.replace(/\/v1\/(?:fit|fill)\/[^/]+\//, `/v1/fit/w_${width},h_${width},q_85/`);
  return `${src.replace(/\/$/, '')}/v1/fit/w_${width},h_${width},q_85/file.${src.split('.').pop()?.split('?')[0] || 'jpg'}`;
}

export default function SmartImage({ src, alt = '', fallback = null, eager = false, sizes = '100vw', onError, ...props }) {
  const [failed, setFailed] = useState(false);
  const [responsive, setResponsive] = useState(true);
  useEffect(() => { setFailed(false); setResponsive(true); }, [src]);
  if (!src || failed) return fallback;
  const isWix = src.includes('static.wixstatic.com/media/');
  return (
    <img
      src={src}
      srcSet={isWix && responsive ? [320, 640, 960, 1280].map(width => `${wixVariant(src, width)} ${width}w`).join(', ') : undefined}
      sizes={isWix && responsive ? sizes : undefined}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      onError={event => {
        if (isWix && responsive) setResponsive(false);
        else setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}
