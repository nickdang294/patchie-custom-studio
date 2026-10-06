import { requireAdmin, serviceDb, jsonError } from '@/lib/supabase';

const MAX_BULK_PATCHES = 500;

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return jsonError(auth.error, auth.status);

  let body;
  try { body = await request.json(); } catch { return jsonError('Dữ liệu không hợp lệ.', 400); }
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter(id => typeof id === 'string' && id.trim()).map(id => id.trim()))] : [];
  const action = body.action;
  if (!ids.length) return jsonError('Chọn ít nhất một patch.', 400);
  if (ids.length > MAX_BULK_PATCHES) return jsonError(`Mỗi lần chỉ xử lý tối đa ${MAX_BULK_PATCHES} patch.`, 400);
  if (!['out_of_stock', 'coming_soon', 'limited', 'delete'].includes(action)) return jsonError('Thao tác không hợp lệ.', 400);

  const db = serviceDb();
  if (action === 'out_of_stock') {
    const { error } = await db.from('patches').update({ stock_quantity: 0 }).in('id', ids);
    if (error) return jsonError(error.message, 500);
  } else if (action === 'coming_soon') {
    const { error } = await db.from('patches').update({ release_status: 'coming_soon' }).in('id', ids);
    if (error) return jsonError(error.message, 500);
  } else if (action === 'limited') {
    const { data, error } = await db.from('patches').select('id,patch_group,patch_groups').in('id', ids);
    if (error) return jsonError(error.message, 500);
    const results = await Promise.all((data || []).map(patch => {
      const groups = Array.from(new Set([...(Array.isArray(patch.patch_groups) && patch.patch_groups.length ? patch.patch_groups : [patch.patch_group || 'Best Seller']), 'Limited']));
      return db.from('patches').update({ patch_groups: groups, patch_group: groups[0] || 'Limited' }).eq('id', patch.id);
    }));
    const failed = results.find(result => result.error);
    if (failed) return jsonError(failed.error.message, 500);
  } else {
    // Preserve order history: patch_order_items.patch_id has ON DELETE RESTRICT.
    // Report the blocked IDs instead of silently archiving or deleting order lines.
    const { error } = await db.from('patches').delete().in('id', ids);
    if (error) {
      if (/foreign key|violates.*constraint|referenced/i.test(error.message || '')) {
        return jsonError('Không thể xóa vĩnh viễn vì một hoặc nhiều patch đang được tham chiếu trong lịch sử đơn hàng. Hãy chuyển chúng sang hết hàng để ẩn khỏi mockup.', 409);
      }
      return jsonError(error.message, 500);
    }
  }
  return Response.json({ ok: true, count: ids.length, action });
}
