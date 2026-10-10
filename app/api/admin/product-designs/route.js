import { requireAdmin, serviceDb, jsonError } from '@/lib/supabase';
import { createProductDesignThumbnail } from '@/lib/product-designs';
import { patchUploadDateFolder } from '@/lib/patch-image-upload';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return jsonError(auth.error, auth.status);
  const { data, error } = await serviceDb().from('product_designs').select('*').order('created_at', { ascending: false });
  if (error) return jsonError(error.message, 500);
  return Response.json({ items: data || [] });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return jsonError(auth.error, auth.status);
  const db = serviceDb();
  let body;
  try { body = await request.json(); } catch { return jsonError('Dữ liệu mẫu phối không hợp lệ.'); }
  const name = String(body.name || '').trim().slice(0, 80);
  const productId = String(body.product_id || '');
  const placements = Array.isArray(body.placements) ? body.placements : [];
  const minMatches = Number(body.min_matches);
  const uniquePatchCount = new Set(placements.map(item => item.patch_id)).size;
  if (!name || !productId || !placements.length || placements.length > 12 || !Number.isInteger(minMatches) || minMatches < 1 || minMatches > uniquePatchCount) return jsonError('Cần tên, base, ít nhất một patch và ngưỡng trùng hợp lệ.');
  const [{ data: product }, { data: patches }] = await Promise.all([
    db.from('products').select('*').eq('id', productId).eq('active', true).maybeSingle(),
    db.from('patches').select('id,image_url,width_cm,height_cm,active,release_status').in('id', [...new Set(placements.map(x => String(x.patch_id || '')))])
  ]);
  if (!product) return jsonError('Sản phẩm base không hoạt động hoặc không tồn tại.');
  const validViews = product.product_type === 'bag' ? ['front', 'back'] : ['front', 'back', 'left_sleeve', 'right_sleeve'];
  const imageFor = view => product.view_images?.[view] || product.image_url;
  if (!imageFor('front') || placements.some(item => !validViews.includes(item.view) || !imageFor(item.view))) return jsonError('Base cần có ảnh hợp lệ cho từng mặt được dùng trong mẫu.');
  const patchMap = new Map((patches || []).map(p => [p.id, p]));
  if (!placements.every(x => patchMap.has(x.patch_id) && patchMap.get(x.patch_id).active && patchMap.get(x.patch_id).release_status !== 'coming_soon' && ['front','back','left_sleeve','right_sleeve'].includes(x.view) && Number.isFinite(Number(x.x)) && Number.isFinite(Number(x.y)))) return jsonError('Có patch hoặc vị trí không hợp lệ.');
  const id = body.id || crypto.randomUUID();
  const createdAt = body.created_at || new Date().toISOString();
  const folderDate = patchUploadDateFolder(new Date(createdAt));
  const path = `product-design-thumbnails/${folderDate}/${id}.webp`;
  try {
    const thumbnail = await createProductDesignThumbnail(product, placements, patchMap);
    const { error: uploadError } = await db.storage.from('product-design-thumbnails').upload(path, thumbnail, { contentType: 'image/webp', cacheControl: '31536000', upsert: true });
    if (uploadError) throw uploadError;
    const updatedAt = new Date().toISOString();
    const thumbnailUrl = `${db.storage.from('product-design-thumbnails').getPublicUrl(path).data.publicUrl}?v=${Date.parse(updatedAt)}`;
    const record = { id, name, product_id: productId, placements, min_matches: minMatches, priority: Number(body.priority) || 0, active: body.active !== false, thumbnail_path: path, thumbnail_url: thumbnailUrl, created_at: createdAt, updated_at: updatedAt };
    const { data, error } = await db.from('product_designs').upsert(record).select().single();
    if (error) throw error;
    return Response.json({ item: data });
  } catch (error) { return jsonError(error.message || 'Không lưu được mẫu phối.', 500); }
}

export async function DELETE(request) {
  const auth = await requireAdmin();
  if (auth.error) return jsonError(auth.error, auth.status);
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('Thiếu ID mẫu.');
  const db = serviceDb();
  const { data, error } = await db.from('product_designs').select('thumbnail_path').eq('id', id).maybeSingle();
  if (error) return jsonError(error.message, 500);
  if (data?.thumbnail_path) await db.storage.from('product-design-thumbnails').remove([data.thumbnail_path]);
  const { error: deleteError } = await db.from('product_designs').delete().eq('id', id);
  if (deleteError) return jsonError(deleteError.message, 500);
  return Response.json({ ok: true });
}
