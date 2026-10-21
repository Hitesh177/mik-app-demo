export function sortCategoriesWithOthersLast(categories) {
  return [...categories].sort((a, b) => {
    const aIsOthers = String(a.slug || a.name || '').toLowerCase().includes('other');
    const bIsOthers = String(b.slug || b.name || '').toLowerCase().includes('other');
    return Number(aIsOthers) - Number(bIsOthers);
  });
}
