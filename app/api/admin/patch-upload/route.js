import { requireAdmin, serviceDb, jsonError } from '@/lib/supabase';
import { uploadPatchWithThumbnail } from '@/lib/patch-image-upload';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return jsonError(auth.error, auth.status);
  const form = await request.formData();
  const file = form.get('file');
  try {
    const result = await uploadPatchWithThumbnail(serviceDb(), file);
    return Response.json(result);
  } catch (error) {
    return jsonError(error.message || 'Không xử lý được ảnh patch.', 400);
  }
}
