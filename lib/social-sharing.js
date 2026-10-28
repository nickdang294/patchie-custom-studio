export const SOCIAL_DEFAULTS = {
  title: 'Patchie Studio — Tự custom áo của bạn',
  description: 'Tự phối patch thêu ủi lên áo Patchie, lưu mockup và gửi cho shop.',
  image: '',
};
export function normalizeSocial(value = {}) {
  const text = (v, fallback, limit) => typeof v === 'string' && v.trim() ? v.trim().slice(0, limit) : fallback;
  let image = '';
  try { const url = new URL(value?.image); if (url.protocol === 'https:' && !url.username && !url.password) image = url.href; } catch {}
  return { title: text(value?.title, SOCIAL_DEFAULTS.title, 100), description: text(value?.description, SOCIAL_DEFAULTS.description, 300), image };
}
export function socialMetadata(value) {
  const {title, description, image} = normalizeSocial(value);
  return {title, description, openGraph: {title, description, siteName: 'Patchie', locale: 'vi_VN', type: 'website', images: image ? [{url: image, alt: title}] : []}, twitter: {card: image ? 'summary_large_image' : 'summary', title, description, images: image ? [image] : []}};
}
