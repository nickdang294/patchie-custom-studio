import { requireAdmin, serviceDb, jsonError } from '@/lib/supabase';

const cleanTags = value => Array.isArray(value)
  ? Array.from(new Set(value.map(tag => String(tag || '').trim()).filter(Boolean)))
  : [];

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return jsonError(auth.error, auth.status);

  const { data, error } = await serviceDb().from('settings').select('value').eq('key', 'recommendationRules').maybeSingle();
  if (error) return jsonError(error.message, 500);
  return Response.json({ rules: Array.isArray(data?.value) ? data.value : [] });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.error) return jsonError(auth.error, auth.status);

  let body;
  try { body = await request.json(); } catch { return jsonError('File quy tắc không hợp lệ.', 400); }
  if (!Array.isArray(body?.rules) || body.rules.length > 500) {
    return jsonError('Gửi tối đa 500 quy tắc mỗi lần.', 400);
  }

  const ids = new Set();
  const errors = [];
  const rules = body.rules.map((row, index) => {
    const rule_id = String(row?.rule_id || '').trim();
    const source_tags = cleanTags(row?.source_tags);
    const target_tags = cleanTags(row?.target_tags);
    const required_shared_prefix = String(row?.required_shared_prefix || '').trim();
    const score = Number(row?.score);
    const active = row?.active === true;
    if (!rule_id || rule_id.length > 100) errors.push(`Dòng ${index + 2}: thiếu rule_id hoặc ID dài quá 100 ký tự.`);
    if (ids.has(rule_id)) errors.push(`Dòng ${index + 2}: rule_id “${rule_id}” bị trùng.`);
    ids.add(rule_id);
    if (!source_tags.length || !target_tags.length) errors.push(`Dòng ${index + 2}: cần source_tags và target_tags.`);
    if ([...source_tags, ...target_tags].some(tag => tag.length > 80)) errors.push(`Dòng ${index + 2}: tag không được dài quá 80 ký tự.`);
    if (!Number.isFinite(score) || score <= 0 || score > 1000) errors.push(`Dòng ${index + 2}: score phải lớn hơn 0 và tối đa 1000.`);
    if (required_shared_prefix.length > 40) errors.push(`Dòng ${index + 2}: required_shared_prefix tối đa 40 ký tự.`);
    return { rule_id, source_tags, target_tags, required_shared_prefix, score, active };
  });
  if (errors.length) return Response.json({ error: 'Có dòng quy tắc cần sửa.', details: errors }, { status: 400 });

  const { error } = await serviceDb().from('settings').upsert({ key: 'recommendationRules', value: rules }, { onConflict: 'key' });
  if (error) return jsonError(error.message, 500);
  return Response.json({ ok: true, count: rules.length, activeCount: rules.filter(rule => rule.active).length });
}
