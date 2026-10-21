import { Fragment } from 'react';

function mediaSource(source) {
  const value = source?.url || source?.id || '';
  if (!value || value.startsWith('/') || /^https?:\/\//.test(value)) return value;
  return `https://static.wixstatic.com/media/${value.replace(/^media\//, '')}`;
}

function videoSource(source) {
  const value = source?.url || source?.id || '';
  if (!value || value.startsWith('/') || /^https?:\/\//.test(value)) return value;
  return `https://video.wixstatic.com/${value}`;
}

function internalHref(href) {
  if (!href) return '#';
  try {
    const url = new URL(href, window.location.origin);
    if (/^(www\.)?(indianstoretaiwan|mikstoretaiwan)\.com$/i.test(url.hostname)) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return href;
  }
  return href;
}

function TextNode({ node }) {
  const decorations = node.textData?.decorations || [];
  let content = node.textData?.text || '';
  for (const decoration of decorations) {
    if (decoration.type === 'BOLD') content = <strong>{content}</strong>;
    if (decoration.type === 'ITALIC') content = <em>{content}</em>;
    if (decoration.type === 'UNDERLINE') content = <u>{content}</u>;
    if (decoration.type === 'LINK') {
      const link = decoration.linkData?.link;
      content = (
        <a
          href={internalHref(link?.url)}
          target={link?.target === 'BLANK' ? '_blank' : undefined}
          rel={link?.target === 'BLANK' ? 'noopener noreferrer' : undefined}
          className="font-medium text-green-700 underline decoration-green-300 underline-offset-2 hover:text-green-900"
        >
          {content}
        </a>
      );
    }
  }
  return content;
}

function children(node, keyPrefix) {
  return (node.nodes || []).map((child, index) => renderNode(child, `${keyPrefix}-${index}`));
}

function ImageNode({ node }) {
  const data = node.imageData || {};
  const src = mediaSource(data.image?.src);
  if (!src) return null;
  return (
    <figure className="my-7">
      <img
        src={src}
        alt={data.altText || data.caption || ''}
        loading="lazy"
        className="mx-auto max-h-[720px] w-auto max-w-full rounded-2xl object-contain"
      />
      {data.caption ? <figcaption className="mt-2 text-center text-sm text-gray-500">{data.caption}</figcaption> : null}
    </figure>
  );
}

function GalleryNode({ node }) {
  const items = node.galleryData?.items || [];
  if (!items.length) return null;
  return (
    <div className="my-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item, index) => {
        const image = item.image || {};
        const src = mediaSource(image.media?.src);
        const content = <img src={src} alt={image.altText || item.title || ''} loading="lazy" className="h-full w-full rounded-2xl object-cover" />;
        return image.link?.url ? (
          <a key={index} href={internalHref(image.link.url)} className="aspect-square overflow-hidden rounded-2xl bg-gray-50">{content}</a>
        ) : <div key={index} className="aspect-square overflow-hidden rounded-2xl bg-gray-50">{content}</div>;
      })}
    </div>
  );
}

function renderNode(node, key = node?.id) {
  if (!node) return null;
  switch (node.type) {
    case 'TEXT': return <TextNode key={key} node={node} />;
    case 'PARAGRAPH': return <p key={key} className="my-4 whitespace-pre-line leading-8 text-gray-700">{children(node, key)}</p>;
    case 'HEADING': {
      const level = Math.min(4, Math.max(2, Number(node.headingData?.level || 2)));
      const Heading = `h${level}`;
      return <Heading key={key} className="mb-3 mt-9 font-black leading-tight text-gray-950">{children(node, key)}</Heading>;
    }
    case 'BULLETED_LIST': return <ul key={key} className="my-5 list-disc space-y-2 pl-6 text-gray-700">{children(node, key)}</ul>;
    case 'ORDERED_LIST': return <ol key={key} className="my-5 list-decimal space-y-2 pl-6 text-gray-700">{children(node, key)}</ol>;
    case 'LIST_ITEM': return <li key={key} className="pl-1">{children(node, key)}</li>;
    case 'IMAGE': return <ImageNode key={key} node={node} />;
    case 'GALLERY': return <GalleryNode key={key} node={node} />;
    case 'VIDEO': {
      const src = videoSource(node.videoData?.video?.src);
      return src ? <video key={key} src={src} poster={mediaSource(node.videoData?.thumbnail?.src)} controls preload="metadata" className="my-7 max-h-[720px] w-full rounded-2xl bg-black" /> : null;
    }
    case 'TABLE': return <div key={key} className="my-7 overflow-x-auto"><table className="w-full border-collapse">{children(node, key)}</table></div>;
    case 'TABLE_ROW': return <tr key={key}>{children(node, key)}</tr>;
    case 'TABLE_CELL': return <td key={key} className="min-w-44 border border-gray-200 p-3 align-top">{children(node, key)}</td>;
    case 'DIVIDER': return <hr key={key} className="my-8 border-gray-200" />;
    case 'BLOCKQUOTE': return <blockquote key={key} className="my-6 border-l-4 border-green-500 bg-green-50 px-5 py-3 italic text-green-950">{children(node, key)}</blockquote>;
    default: return <Fragment key={key}>{children(node, key)}</Fragment>;
  }
}

export default function WixRichContent({ content }) {
  return <div className="wix-rich-content">{(content?.nodes || []).map((node, index) => renderNode(node, `${node.id || node.type}-${index}`))}</div>;
}
