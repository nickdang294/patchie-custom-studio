export const VIEW_SETS = {
  shirt: ['front', 'left_sleeve', 'right_sleeve', 'back'],
  bag: ['front', 'back']
};

const productGroupSlug = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function productKind(productType, brand = {}) {
  const groups = Array.isArray(brand?.productGroups) ? brand.productGroups : [];
  const raw = String(productType ?? '').trim().toLowerCase();
  const slug = productGroupSlug(productType);
  const group = groups.find(item => [item?.id, item?.value, item?.label, item?.name].some(value => {
    const candidate = String(value ?? '').trim().toLowerCase();
    return candidate === raw || (slug && productGroupSlug(value) === slug);
  }));
  return group?.kind === 'bag' || (!group && ['bag', 'tote'].includes(raw)) ? 'bag' : 'shirt';
}

export function productViews(productType, brand = {}) {
  return VIEW_SETS[productKind(productType, brand)] || VIEW_SETS.shirt;
}
