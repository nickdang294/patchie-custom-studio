import { patchFitsProduct, productViews } from './products';
export const RETIRED_SETTINGS = ['giftOffer','popupCampaigns','activePopupCampaign','halloweenThemeEnabled','halloweenFeatures'];
export function cleanSettings(settings = {}) {
  return Object.fromEntries(Object.entries(settings).filter(([key]) => !RETIRED_SETTINGS.includes(key)));
}
export function normalizeBestsellers(value = {}) {
  return { enabled: value?.enabled === true, title: String(value?.title || 'Best-seller tháng này').trim().slice(0,80), designIds: [...new Set((Array.isArray(value?.designIds) ? value.designIds : []).filter(id => typeof id === 'string' && id.trim()).map(id => id.trim()))].slice(0,3) };
}
export function selectBestsellers(config, designs, products, patches, brand = {}) {
  const settings = normalizeBestsellers(config);
  if (!settings.enabled) return [];
  const byPatch = new Map(patches.map(p => [p.id,p]));
  return settings.designIds.map(id => designs.find(d => d.id === id)).filter(design => {
    if (!design || design.active === false || !design.thumbnail_url) return false;
    const product = products.find(p => p.id === design.product_id && p.active !== false);
    const placements = design.placements;
    if (!product || !Array.isArray(placements) || !placements.length || placements.length > 12) return false;
    const views = productViews(product.product_type,brand);
    return placements.every(item => {
      const patch = byPatch.get(item.patch_id);
      return patch && patch.active !== false && patch.release_status !== 'coming_soon' && Number(patch.stock_quantity ?? 20) > 0 && patchFitsProduct(patch,product) && views.includes(item.view) && [item.x,item.y].every(n => Number.isFinite(Number(n)) && Number(n) >= 0 && Number(n) <= 1);
    });
  }).map(d => ({id:d.id,name:d.name,product_id:d.product_id,thumbnail_url:d.thumbnail_url,shopee_url:d.shopee_url || '',placements:d.placements}));
}
