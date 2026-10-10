import { serviceDb } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('productId') || '';
  const selected = [...new Set((url.searchParams.get('patchIds') || '').split(',').filter(Boolean))];
  if (!productId || !selected.length) return Response.json({ items: [] }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const db = serviceDb();
    const [{ data: designs }, { data: selectedPatches }] = await Promise.all([
      db.from('product_designs').select('*').eq('product_id', productId).eq('active', true).order('priority', { ascending: false }),
      db.from('patches').select('id,active,stock_quantity,release_status').in('id', selected)
    ]);
    const patchIdsInDesigns = [...new Set((designs || []).flatMap(item => item.placements.map(p => p.patch_id)))];
    const [{ data: product }, { data: allPatches }] = await Promise.all([
      db.from('products').select('id').eq('id', productId).eq('active', true).maybeSingle(),
      patchIdsInDesigns.length ? db.from('patches').select('id,active,stock_quantity,release_status').in('id', patchIdsInDesigns) : Promise.resolve({ data: [] })
    ]);
    if (!product) return Response.json({ items: [] }, { headers: { 'Cache-Control': 'no-store' } });
    const patchMap = new Map([...(allPatches || []), ...(selectedPatches || [])].map(p => [p.id, p]));
    const allowed = new Set((selectedPatches || []).filter(p => p.active && Number(p.stock_quantity ?? 20) > 0 && p.release_status === 'released').map(p => p.id));
    const items = (designs || []).map(item => {
      const ids = [...new Set(item.placements.map(p => p.patch_id))];
      const matches = ids.filter(id => allowed.has(id) && selected.includes(id)).length;
      const available = ids.every(id => { const patch = patchMap.get(id); return patch && patch.active && Number(patch.stock_quantity ?? 20) > 0 && patch.release_status === 'released'; });
      return { ...item, match_count: matches, total_patches: ids.length, available };
    }).filter(item => item.match_count >= item.min_matches)
      .filter(item => item.available)
      .sort((a, b) => b.match_count - a.match_count || b.priority - a.priority || a.name.localeCompare(b.name, 'vi'))
      .slice(0, 9);
    return Response.json({ items }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch { return Response.json({ items: [] }, { headers: { 'Cache-Control': 'no-store' } }); }
}
