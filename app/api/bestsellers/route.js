import { serviceDb, jsonError } from '@/lib/supabase';
import { normalizeBestsellers, selectBestsellers } from '@/lib/bestsellers';
export async function GET() {
  try {
    const db = serviceDb();
    const {data:rows,error:settingsError} = await db.from('settings').select('key,value').in('key',['bestsellers','brand']);
    if (settingsError) throw settingsError;
    const settings = Object.fromEntries((rows || []).map(row => [row.key,row.value]));
    const config = normalizeBestsellers(settings.bestsellers);
    if (!config.enabled || !config.designIds.length) return Response.json({title:config.title,items:[]});
    const {data:designs,error} = await db.from('product_designs').select('id,name,product_id,thumbnail_url,shopee_url,placements,active').in('id',config.designIds);
    if (error) throw error;
    const productIds = [...new Set((designs || []).map(d => d.product_id))];
    const patchIds = [...new Set((designs || []).flatMap(d => (d.placements || []).map(p => p.patch_id)))];
    if (!productIds.length || !patchIds.length) return Response.json({title:config.title,items:[]});
    const [products,patches] = await Promise.all([
      db.from('products').select('*').in('id',productIds).eq('active',true),
      db.from('patches').select('id,active,release_status,stock_quantity,width_cm,height_cm').in('id',patchIds)
    ]);
    if (products.error || patches.error) throw products.error || patches.error;
    return Response.json({title:config.title,items:selectBestsellers(config,designs || [],products.data || [],patches.data || [],settings.brand || {})},{headers:{'Cache-Control':'no-store'}});
  } catch { return jsonError('Chưa tải được mẫu nổi bật.',503); }
}
