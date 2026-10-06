import sharp from 'sharp';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function patchUploadDateFolder(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export async function createPatchThumbnail(input) {
  return sharp(input, { limitInputPixels: 25_000_000 })
    .rotate()
    .resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72, alphaQuality: 80, effort: 4 })
    .toBuffer();
}

export async function uploadPatchWithThumbnail(db, file) {
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_UPLOAD_BYTES || !ALLOWED_TYPES.has(file.type)) {
    throw new Error('Chọn PNG, JPG hoặc WebP tối đa 4 MB.');
  }

  const original = Buffer.from(await file.arrayBuffer());
  const thumbnail = await createPatchThumbnail(original);

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
  const key = crypto.randomUUID();
  const dateFolder = patchUploadDateFolder();
  const originalPath = `Patch Bulk Upload/${dateFolder}/${key}.${ext}`;
  const thumbnailPath = `Patch Bulk Upload/${dateFolder}/thumbnail/${key}.webp`;
  const bucket = db.storage.from('patch-assets');

  const { error: originalError } = await bucket.upload(originalPath, original, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false
  });
  if (originalError) throw new Error(originalError.message);

  const { error: thumbnailError } = await bucket.upload(thumbnailPath, thumbnail, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: false
  });
  if (thumbnailError) {
    await bucket.remove([originalPath]);
    throw new Error(`Đã nhận ảnh gốc nhưng chưa lưu được thumbnail: ${thumbnailError.message}`);
  }

  return {
    image_url: bucket.getPublicUrl(originalPath).data.publicUrl,
    thumbnail_url: bucket.getPublicUrl(thumbnailPath).data.publicUrl,
    original_size_bytes: original.length,
    thumbnail_size_bytes: thumbnail.length
  };
}
