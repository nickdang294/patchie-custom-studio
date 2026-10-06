import { requireAdmin, serviceDb, jsonError } from '@/lib/supabase';
import { createPatchThumbnail, patchUploadDateFolder } from '@/lib/patch-image-upload';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return jsonError(auth.error, auth.status);
  let body;
  try { body = await request.json(); } catch { return jsonError('Dữ liệu không hợp lệ.', 400); }
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter(id => typeof id === 'string' && id.trim()).map(id => id.trim()))] : [];
  if (!ids.length || ids.length > 5) return jsonError('Chọn từ 1 đến 5 patch mỗi lượt.', 400);

  const db = serviceDb();
  const { data: patches, error } = await db.from('patches').select('id,image_url,thumbnail_url,created_at').in('id', ids);
  if (error) return jsonError(error.message, 500);
  let created = 0;
  const failed = [];
  for (const patch of patches || []) {
    if (patch.thumbnail_url) continue;
    try {
      const marker = '/storage/v1/object/public/patch-assets/';
      const image = new URL(patch.image_url);
      const markerIndex = image.pathname.indexOf(marker);
      if (markerIndex < 0) throw new Error('Ảnh không nằm trong bucket patch-assets.');
      const objectPath = decodeURIComponent(image.pathname.slice(markerIndex + marker.length));
      const { data: file, error: downloadError } = await db.storage.from('patch-assets').download(objectPath);
      if (downloadError || !file) throw new Error(downloadError?.message || 'Không tải được ảnh gốc.');
      const buffer = Buffer.from(await file.arrayBuffer());
      const thumbnail = await createPatchThumbnail(buffer);
      const safeId = patch.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const thumbnailDate = patchUploadDateFolder(patch.created_at ? new Date(patch.created_at) : new Date());
      const thumbnailPath = `Patch Bulk Upload/${thumbnailDate}/thumbnail/${safeId}.webp`;
      const { error: uploadError } = await db.storage.from('patch-assets').upload(thumbnailPath, thumbnail, {
        contentType: 'image/webp', cacheControl: '31536000', upsert: true
      });
      if (uploadError) throw new Error(uploadError.message);
      const thumbnailUrl = db.storage.from('patch-assets').getPublicUrl(thumbnailPath).data.publicUrl;
      const { error: updateError } = await db.from('patches').update({ thumbnail_url: thumbnailUrl }).eq('id', patch.id);
      if (updateError) throw new Error(updateError.message);
      created += 1;
    } catch (error) {
      failed.push({ id: patch.id, error: error.message || 'Không tạo được thumbnail.' });
    }
  }
  return Response.json({ ok: failed.length === 0, created, failed });
}
