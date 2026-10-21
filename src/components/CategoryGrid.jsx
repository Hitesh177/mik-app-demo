import CategoryArtwork from './CategoryArtwork';
import { sortCategoriesWithOthersLast } from '../lib/categoryOrdering';

export default function CategoryGrid({ categories, onCategorySelect, activeCategoryId, isZh = false }) {
  const categoryItems = sortCategoriesWithOthersLast(
    categories.filter(category => category.visible !== false && category.slug !== 'all-products'),
  );
  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-8">
      <h2 className="text-lg font-bold text-gray-800 mb-4">{isZh ? '依分類選購' : 'Shop by Category'}</h2>
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-9 gap-2 sm:gap-3">
        {categoryItems.map((cat) => {
          const isActive = activeCategoryId === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.path || `/${cat.slug}`)}
              type="button"
              aria-label={`${isZh ? '瀏覽' : 'Browse'} ${cat.name}`}
              className="group flex flex-col items-center gap-1.5 focus:outline-none transition-transform duration-200 hover:-translate-y-1 active:scale-95"
            >
              <div
                className={`w-full aspect-square rounded-xl bg-gray-50 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:border-green-200 transition-all duration-200 ${isActive ? 'ring-2 ring-green-600 ring-offset-1' : 'border border-white'} min-h-[56px] sm:min-h-[68px] overflow-hidden`}
              >
                <CategoryArtwork categoryId={cat.slug} label={cat.name} imageUrl={cat.image_url} />
              </div>
              <span className={`text-center text-[10px] sm:text-xs font-medium leading-tight whitespace-pre-line min-h-[28px] sm:min-h-[32px] ${isActive ? 'text-green-700 font-semibold' : 'text-gray-700'}`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
