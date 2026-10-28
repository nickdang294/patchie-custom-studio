import {revalidateTag, revalidatePath} from 'next/cache';
import {requireAdmin, serviceDb, jsonError} from '@/lib/supabase';
import {normalizeSocial} from '@/lib/social-sharing';
import {SOCIAL_CACHE_TAG} from '@/lib/social-sharing-server';
export async function GET() {
  const auth = await requireAdmin(); if (auth.error) return jsonError(auth.error, auth.status);
  const {data, error} = await serviceDb().from('settings').select('value').eq('key', 'socialSharing').maybeSingle();
  if (error) return jsonError('Không tải được cài đặt chia sẻ.', 500);
  return Response.json(normalizeSocial(data?.value), {headers: {'Cache-Control': 'no-store'}});
}
export async function POST(request) {
  const auth = await requireAdmin(); if (auth.error) return jsonError(auth.error, auth.status);
  let body; try { body = await request.json(); } catch { return jsonError('Dữ liệu không hợp lệ.'); }
  if (!body || typeof body !== 'object' || typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 100 || typeof body.description !== 'string' || !body.description.trim() || body.description.trim().length > 300 || typeof body.image !== 'string') return jsonError('Nhập tiêu đề tối đa 100 ký tự và mô tả tối đa 300 ký tự.');
  const value = normalizeSocial(body);
  if (body.image && !value.image) return jsonError('Ảnh cần có đường dẫn HTTPS hợp lệ.');
  const {error} = await serviceDb().from('settings').upsert({key: 'socialSharing', value}, {onConflict: 'key'});
  if (error) return jsonError('Chưa lưu được. Vui lòng thử lại.', 500);
  revalidateTag(SOCIAL_CACHE_TAG);
  revalidatePath('/', 'layout');
  return Response.json({ok: true, value});
}
