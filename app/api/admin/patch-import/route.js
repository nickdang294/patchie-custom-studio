import { requireAdmin, serviceDb, jsonError } from '@/lib/supabase';
import { uploadPatchWithThumbnail } from '@/lib/patch-image-upload';

export const runtime = 'nodejs';

const text = value => String(value ?? '').trim();
const CLEAR = '__CLEAR__';
const EDITABLE = ['name','image_filename','image_url','thumbnail_url','width_cm','height_cm','price','quote','patch_group','patch_groups','tags','recommended_patch_ids','release_status','stock_quantity','sold_count','is_featured','is_new','active','sort_order'];
const arrayValue = value => Array.isArray(value) ? value.map(text).filter(Boolean) : typeof value === 'string' ? value.split(/[;,|]/).map(text).filter(Boolean) : [];
const hasValue = value => value !== undefined && value !== null && text(value) !== '';
const isClear = value => text(value).toUpperCase() === CLEAR;
function boolValue(value, field, line, errors) {
  if (typeof value === 'boolean') return value;
  const normalized = text(value).toLowerCase();
  if (['true','1','yes','y','có'].includes(normalized)) return true;
  if (['false','0','no','n','không'].includes(normalized)) return false;
  errors.push(`Dòng ${line}: ${field} cần là true/false.`);
  return false;
}
function numberValue(value, field, line, errors, { min = -Infinity, integer = false, nullable = false } = {}) {
  if (isClear(value) && nullable) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || (integer && !Number.isInteger(number))) {
    errors.push(`Dòng ${line}: ${field} không hợp lệ.`);
    return undefined;
  }
  return number;
}
async function checkRecommendationIds(db, items) {
  const ids = [...new Set(items.flatMap(item => item.recommended_patch_ids || []))];
  if (!ids.length) return null;
  const known = new Set(items.map(item => item.id));
  const unresolved = ids.filter(id => !known.has(id));
  if (!unresolved.length) return null;
  const { data, error } = await db.from('patches').select('id').in('id', unresolved);
  if (error) return error.message;
  const present = new Set((data || []).map(item => item.id));
  const missing = unresolved.filter(id => !present.has(id));
  return missing.length ? `ID gợi ý chưa tồn tại: ${missing.join(', ')}` : null;
}
async function readRows(db, rows) {
  const ids = rows.map(row => text(row?.id));
  if (ids.some(id => !id)) return { error: 'Mỗi dòng cập nhật cần có ID patch.' };
  if (new Set(ids).size !== ids.length) return { error: 'File có ID bị lặp; mỗi patch chỉ được có một dòng.' };
  const { data, error } = await db.from('patches').select('*').in('id', ids);
  if (error) return { error: error.message };
  const byId = new Map((data || []).map(item => [item.id, item]));
  const missing = ids.filter(id => !byId.has(id));
  if (missing.length) return { error: `Không tìm thấy patch ID: ${missing.join(', ')}` };
  return { byId };
}
function mergeUpdateRows(rows, byId) {
  const errors = [], merged = [];
  rows.forEach((row, index) => {
    const line = index + 2, id = text(row.id), current = byId.get(id);
    const unknown = Object.keys(row).filter(key => key && key !== 'id' && !EDITABLE.includes(key));
    if (unknown.length) errors.push(`Dòng ${line}: cột không được hỗ trợ: ${unknown.join(', ')}.`);
    const item = { ...current };
    for (const [field, raw] of Object.entries(row)) {
      if (field === 'id' || !EDITABLE.includes(field) || field === 'image_filename' || !hasValue(raw)) continue;
      if (field === 'image_url') { item.image_url = text(raw); continue; }
      if (field === 'thumbnail_url') { item.thumbnail_url = text(raw) || null; continue; }
      if (field === 'name') { item.name = text(raw); if (!item.name) errors.push(`Dòng ${line}: name không được để trống.`); continue; }
      if (field === 'quote') { item.quote = isClear(raw) ? '' : text(raw); continue; }
      if (field === 'release_status') {
        const value = text(raw);
        if (!['released','coming_soon'].includes(value)) errors.push(`Dòng ${line}: release_status phải là released hoặc coming_soon.`);
        else item.release_status = value;
        continue;
      }
      if (['active','is_featured','is_new'].includes(field)) { item[field] = boolValue(raw, field, line, errors); continue; }
      if (['width_cm','height_cm'].includes(field)) { const value = numberValue(raw, field, line, errors, { min: Number.EPSILON }); if (value !== undefined) item[field] = value; continue; }
      if (field === 'price') { const value = numberValue(raw, field, line, errors, { min: 0, nullable: true }); if (value !== undefined || isClear(raw)) item.price = value; continue; }
      if (['stock_quantity','sold_count','sort_order'].includes(field)) { const value = numberValue(raw, field, line, errors, { min: field === 'sort_order' ? -Infinity : 0, integer: true }); if (value !== undefined) item[field] = value; continue; }
      if (['patch_groups','patch_group','tags','recommended_patch_ids'].includes(field)) {
        const values = isClear(raw) ? [] : arrayValue(raw);
        if (field === 'patch_groups') { item.patch_groups = values.length ? values : ['Best Seller']; item.patch_group = item.patch_groups[0]; }
        else if (field === 'patch_group') { item.patch_group = values[0] || 'Best Seller'; item.patch_groups = [item.patch_group, ...(item.patch_groups || []).filter(group => group !== item.patch_group)]; }
        else item[field] = values;
      }
    }
    if (hasValue(row.image_url)) { item.image_url = text(row.image_url); if (!hasValue(row.thumbnail_url)) item.thumbnail_url = null; }
    if (!item.image_url) errors.push(`Dòng ${line}: image_url sau cập nhật không được để trống.`);
    merged.push(item);
  });
  return { merged, errors };
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return jsonError(auth.error, auth.status);
  const db = serviceDb();

  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    const form = await request.formData(), file = form.get('file');
    try { return Response.json(await uploadPatchWithThumbnail(db,file)); }
    catch(error) { return jsonError(error.message||'Không xử lý được ảnh patch.',400); }
  }

  let body;
  try { body = await request.json(); } catch { return jsonError('Dữ liệu import không hợp lệ.'); }
  if (!Array.isArray(body?.items) || body.items.length < 1 || body.items.length > 100) return jsonError('Gửi từ 1 đến 100 patch mỗi lần.', 400);

  if (body.mode === 'validate-update' || body.mode === 'update') {
    const rows = body.items;
    const headers = [...new Set(rows.flatMap(row => Object.keys(row || {})))];
    const unknown = headers.filter(key => key && key !== 'id' && !EDITABLE.includes(key));
    if (unknown.length) return jsonError(`Cột không được hỗ trợ: ${unknown.join(', ')}.`, 400);
    if (rows.some(row => hasValue(row.image_filename) && !text(row.image_url))) {
      // A filename is resolved and uploaded by the client before the final update request.
      if (body.mode === 'update') return jsonError('Chưa tải ảnh theo image_filename lên Supabase.');
    }
    const lookup = await readRows(db, rows);
    if (lookup.error) return jsonError(lookup.error, 400);
    const { merged, errors } = mergeUpdateRows(rows, lookup.byId);
    if (errors.length) return Response.json({ error: 'Có dòng cần sửa trước khi cập nhật.', details: errors }, { status: 400 });
    const recommendationError = await checkRecommendationIds(db, merged);
    if (recommendationError) return jsonError(recommendationError, 400);
    if (body.mode === 'validate-update') return Response.json({ ok: true, count: merged.length });
    const { data, error } = await db.from('patches').upsert(merged, { onConflict: 'id' }).select('id');
    if (error) return jsonError(error.message, 500);
    return Response.json({ ok: true, count: data?.length || merged.length });
  }

  if (body.mode !== 'create') return jsonError('Chế độ bulk patch không hợp lệ.', 400);
  const items = [], errors = [], ids = new Set();
  for (let index = 0; index < body.items.length; index += 1) {
    const row = body.items[index] || {}, id = text(row.id), name = text(row.name), image_url = text(row.image_url);
    const width_cm = Number(row.width_cm), height_cm = Number(row.height_cm);
    if (!id || !name || !image_url || !(width_cm > 0) || !(height_cm > 0)) { errors.push(`Dòng ${index + 2}: cần có id, name, image_url, width_cm và height_cm.`); continue; }
    if (ids.has(id)) { errors.push(`Dòng ${index + 2}: ID ${id} bị trùng trong file.`); continue; }
    ids.add(id);
    const price = row.price === '' || row.price == null ? null : Number(row.price);
    const stock_quantity = row.stock_quantity === '' || row.stock_quantity == null ? 20 : Number(row.stock_quantity);
    const sold_count = row.sold_count === '' || row.sold_count == null ? 0 : Number(row.sold_count);
    const sort_order = row.sort_order === '' || row.sort_order == null ? 100 : Number(row.sort_order);
    if (price !== null && (!Number.isFinite(price) || price < 0)) errors.push(`Dòng ${index + 2}: giá phải là số không âm hoặc để trống.`);
    if (!Number.isInteger(stock_quantity) || stock_quantity < 0) errors.push(`Dòng ${index + 2}: stock_quantity phải là số nguyên không âm.`);
    if (!Number.isInteger(sold_count) || sold_count < 0) errors.push(`Dòng ${index + 2}: sold_count phải là số nguyên không âm.`);
    if (!Number.isInteger(sort_order)) errors.push(`Dòng ${index + 2}: sort_order phải là số nguyên.`);
    const groups = arrayValue(row.patch_groups ?? row.patch_group), tags = arrayValue(row.tags), recommendations = arrayValue(row.recommended_patch_ids);
    const release_status = text(row.release_status || 'released');
    if (!['released','coming_soon'].includes(release_status)) errors.push(`Dòng ${index + 2}: release_status phải là released hoặc coming_soon.`);
    items.push({ id, name, image_url, thumbnail_url: text(row.thumbnail_url)||null, width_cm, height_cm, price, quote: text(row.quote), patch_group: groups[0] || 'Best Seller', patch_groups: groups.length ? groups : ['Best Seller'], tags, recommended_patch_ids: recommendations, release_status, active: row.active === false || String(row.active).toLowerCase() === 'false' ? false : true, stock_quantity, sold_count, is_featured: row.is_featured === true || String(row.is_featured).toLowerCase() === 'true', is_new: row.is_new === true || String(row.is_new).toLowerCase() === 'true', sort_order });
  }
  if (errors.length) return Response.json({ error: 'Có dòng cần sửa trước khi thêm patch.', details: errors }, { status: 400 });
  const { data: existing, error: existingError } = await db.from('patches').select('id').in('id', items.map(item => item.id));
  if (existingError) return jsonError(existingError.message, 500);
  if (existing?.length) return jsonError(`Các ID này đã tồn tại: ${existing.map(item => item.id).join(', ')}. Chọn “Cập nhật patch theo ID” để sửa patch có sẵn.`, 409);
  const recommendationError = await checkRecommendationIds(db, items);
  if (recommendationError) return jsonError(recommendationError, 400);
  const { data, error } = await db.from('patches').insert(items).select('id');
  if (error) return jsonError(error.message, 500);
  return Response.json({ ok: true, count: data?.length || items.length });
}
