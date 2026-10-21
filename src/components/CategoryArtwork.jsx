import { useEffect, useState } from 'react';
import { CATEGORY_TILE_IMAGES, CATEGORY_VISUALS, categoryVisualKey } from '../data/categoryVisuals';

const POSITIONS = [
  'left-[2%] bottom-[5%] w-[55%] h-[88%] z-10',
  'right-[1%] bottom-[8%] w-[51%] h-[82%] z-20',
  'left-[31%] bottom-[1%] w-[42%] h-[68%] z-30',
];

export default function CategoryArtwork({ categoryId, label, emoji = '🛒', imageUrl }) {
  const [showPreferredImage, setShowPreferredImage] = useState(Boolean(imageUrl));
  const visualKey = categoryVisualKey(categoryId);
  const tileImage = CATEGORY_TILE_IMAGES[visualKey];
  const images = CATEGORY_VISUALS[visualKey];

  useEffect(() => {
    setShowPreferredImage(Boolean(imageUrl));
  }, [imageUrl]);

  if (tileImage) {
    return <img src={tileImage} alt={label} className="w-full h-full object-contain" loading="lazy" />;
  }

  if (!images?.length && showPreferredImage) {
    return (
      <img
        src={imageUrl}
        alt={label}
        className="w-full h-full object-contain p-1"
        loading="lazy"
        onError={() => setShowPreferredImage(false)}
      />
    );
  }

  if (!images?.length) {
    return (
      <span className="text-3xl sm:text-4xl select-none transition-transform duration-200 group-hover:scale-110">
        {emoji}
      </span>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[inherit]" aria-label={`${label} products`} role="img">
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          className={`absolute object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105 ${POSITIONS[index]}`}
          loading="lazy"
        />
      ))}
    </div>
  );
}
