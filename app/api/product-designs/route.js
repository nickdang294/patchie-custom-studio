import { serviceDb } from '@/lib/supabase';
import { selectProductDesignRecommendations } from '@/lib/product-design-recommendations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const headers={'Cache-Control':'no-store, max-age=0'};
export async function GET(request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('productId') || '';
  const selected = [...new Set((url.searchParams.get('patchIds') || '').split(',').filter(Boolean))];
  if (!productId || !selected.length) return Response.json({ items: [] }, {headers});
  try {
    const db = serviceDb();
    const [{data:designs,error:designError},{data:product,error:productError}]=await Promise.all([
      db.from('product_designs').select('id,name,shopee_url,product_id,thumbnail_url,placements,priority,active').eq('product_id',productId).eq('active',true),
      db.from('products').select('id').eq('id',productId).eq('active',true).maybeSingle()
    ]);
    if(designError||productError)throw new Error('Không tải được mẫu phối.');
    if(!product)return Response.json({items:[]},{headers});
    const ids=[...new Set((designs||[]).flatMap(d=>(d.placements||[]).map(p=>p.patch_id)))];
    const {data:patches,error:patchError}=ids.length
      ?await db.from('patches').select('id,active,stock_quantity,release_status').in('id',ids)
      :{data:[],error:null};
    if(patchError)throw new Error('Không tải được dữ liệu patch.');
    const items=selectProductDesignRecommendations(designs||[],patches||[],selected,productId);
    return Response.json({items},{headers});
  }catch{return Response.json({error:'Không tải được mẫu phối. Vui lòng thử lại.'},{status:503,headers});}
}
