export const VIEW_SETS = {
  shirt: ['front', 'left_sleeve', 'right_sleeve', 'back'],
  bag: ['front', 'back']
};

export function productKind(productType, brand = {}) {
  const groups = Array.isArray(brand?.productGroups) ? brand.productGroups : [];
  const group = groups.find(item => (item?.id || item?.value) === productType);
  return group?.kind === 'bag' ? 'bag' : 'shirt';
}

export function productViews(productType, brand = {}) {
  return VIEW_SETS[productKind(productType, brand)] || VIEW_SETS.shirt;
}
