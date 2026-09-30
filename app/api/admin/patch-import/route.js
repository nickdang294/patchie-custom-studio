import { requireAdmin, serviceDb, jsonError } from '@/lib/supabase';

const text = (value) => String(value ?? '').trim();
const stringArray = (value) => Array.isArray(value)
  ? value.map(text).filter(Boolean)
  : typeof value === 'string' ? value.split(/[;,|]/).map(text).filter(Boolean) : [];

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return jsonError(auth.error, auth.status);

  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size > 4 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      return jsonError('Chọn PNG, JPG hoặc WebP tối đa 4 MB.');
    }
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const path = `Patch Bulk Upload/${crypto.randomUUID()}.${ext}`;
    const db = serviceDb();
    const { error } = await db.storage.from('patch-assets').upload(path, file, { contentType: file.type, upsert: false });
    if (error) return jsonError(error.message, 500);
    const { data } = db.storage.from('patch-assets').getPublicUrl(path);
    return Response.json({ image_url: data.publicUrl, storage_path: path });
  }

  let body;
  try { body = await request.json(); } catch { return jsonError('Dữ liệu import không hợp lệ.'); }
  if (!Array.isArray(body?.items) || body.items.length < 1 || body.items.length > 100) {
    return jsonError('Gửi từ 1 đến 100 patch mỗi lần.', 400);
  }

  const items = [];
  const errors = [];
  const ids = new Set();
  for (let index = 0; index < body.items.length; index += 1) {
    const row = body.items[index] || {};
    const id = text(row.id);
    const name = text(row.name);
    const image_url = text(row.image_url);
    const width_cm = Number(row.width_cm);
    const height_cm = Number(row.height_cm);
    if (!id || !name || !image_url || !(width_cm > 0) || !(height_cm > 0)) {
      errors.push(`Dòng ${index + 2}: cần có id, name, image_url, width_cm và height_cm.`);
      continue;
    }
    if (ids.has(id)) { errors.push(`Dòng ${index + 2}: ID ${id} bị trùng trong file.`); continue; }
    ids.add(id);
    const groups = stringArray(row.patch_groups ?? row.patch_group);
    const tags = stringArray(row.tags);
    const recommendations = stringArray(row.recommended_patch_ids);
    const price = row.price === '' || row.price == null ? null : Number(row.price);
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      errors.push(`Dòng ${index + 2}: giá phải là số không âm hoặc để trống.`); continue;
    }
    items.push({
      id, name, image_url, width_cm, height_cm,
      price,
      quote: text(row.quote) || null,
      patch_group: groups[0] || 'Best Seller',
      patch_groups: groups.length ? groups : ['Best Seller'],
      tags,
      recommended_patch_ids: recommendations,
      release_status: row.release_status === 'coming_soon' ? 'coming_soon' : 'released',
      active: row.active === false || String(row.active).toLowerCase() === 'false' ? false : true,
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 100
    });
  }
  if (errors.length) return Response.json({ error: 'Có dòng cần sửa trước khi import.', details: errors }, { status: 400 });

  const db = serviceDb();
  const knownIds = new Set(items.map(item => item.id));
  const referenced = [...new Set(items.flatMap(item => item.recommended_patch_ids))];
  const missing = referenced.filter(id => !knownIds.has(id));
  if (missing.length) {
    const { data, error } = await db.from('patches').select('id').in('id', missing);
    if (error) return jsonError(error.message, 500);
    const existing = new Set((data || []).map(row => row.id));
    const unresolved = missing.filter(id => !existing.has(id));
    if (unresolved.length) return Response.json({ error: `ID gợi ý chưa tồn tại: ${unresolved.join(', ')}` }, { status: 400 });
  }
  const { data, error } = await db.from('patches').upsert(items, { onConflict: 'id' }).select('id');
  if (error) return jsonError(error.message, 500);
  return Response.json({ ok: true, count: data?.length || items.length });
}
