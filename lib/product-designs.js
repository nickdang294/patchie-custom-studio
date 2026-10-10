import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

async function imageBytes(url) {
  const source = String(url || '');
  if (source.startsWith('/assets/')) return fs.readFile(path.join(process.cwd(), 'public', source.slice(1)));
  const response = await fetch(source);
  if (!response.ok) throw new Error('Không tải được ảnh để tạo thumbnail.');
  return Buffer.from(await response.arrayBuffer());
}

export async function createProductDesignThumbnail(product, placements, patches) {
  const thumbnailView = placements.some(item => item.view === 'front') ? 'front' : (placements[0]?.view || 'front');
  placements = placements.filter(item => item.view === thumbnailView);
  const baseUrl = product.view_images?.[thumbnailView] || product.image_url;
  const base = await imageBytes(baseUrl);
  const metadata = await sharp(base).metadata();
  const width = 420;
  const height = Math.round(width * (metadata.height / metadata.width));
  const patchBuffers = [];
  for (const item of placements) {
    const patch = patches.get(item.patch_id);
    patchBuffers.push({ item, patch, input: await imageBytes(patch.image_url) });
  }
  for (const outputWidth of [420, 320, 240]) {
    const outputHeight = outputWidth;
    const overlays = [];
    for (const { item, patch, input } of patchBuffers) {
      const refW = Number(product.reference_width_cm) > 0 ? Number(product.reference_width_cm) : 62.5;
      const refH = Number(product.reference_height_cm) > 0 ? Number(product.reference_height_cm) : 62.5;
      const fitW = Number(product.image_fit_percent) > 0 ? Math.min(100, Number(product.image_fit_percent)) / 100 : 1;
      const fitH = Number(product.image_fit_height_percent) > 0 ? Math.min(100, Number(product.image_fit_height_percent)) / 100 : fitW;
      const patchW = Math.max(.1, Math.min(100, Number(patch.width_cm || 4) / refW * fitW * 100));
      const patchH = Math.max(.1, Math.min(100, Number(patch.height_cm || 4) / refH * fitH * 100));
      const patchBuffer = await sharp(input).resize(Math.max(1, Math.round(outputWidth * patchW / 100)), Math.max(1, Math.round(outputHeight * patchH / 100)), { fit: 'fill' }).rotate(Number(item.rotation) || 0).png().toBuffer();
      const size = await sharp(patchBuffer).metadata();
      overlays.push({ input: patchBuffer, left: Math.max(0, Math.round(Number(item.x) * outputWidth - size.width / 2)), top: Math.max(0, Math.round(Number(item.y) * outputHeight - size.height / 2)) });
    }
    for (const quality of [70, 58, 46, 36]) {
      const output = await sharp(base).resize(outputWidth, outputHeight, { fit: 'cover' }).composite(overlays).webp({ quality, effort: 6 }).toBuffer();
      if (output.length <= 30 * 1024) return output;
      if (outputWidth === 240 && quality === 36 && output.length <= 50 * 1024) return output;
    }
  }
  throw new Error('Thumbnail mẫu phối vượt quá 50 KB.');
}
