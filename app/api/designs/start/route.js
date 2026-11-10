import { serviceDb, jsonError } from '@/lib/supabase';
import { productViews, patchFitsProduct } from '@/lib/products';
const newId=()=>`PCH-${crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase()}`;

export async function POST(request){
  let body;
  try{body=await request.json();}catch{return jsonError('Dữ liệu gửi lên không hợp lệ.');}
  const size=String(body?.size||'').trim().slice(0,20),mode=body?.mode==='shop'?'shop':'diy';
  const productId=String(body?.productId||'').slice(0,80),note=String(body?.note||'').trim().slice(0,1200),requestedId=String(body?.orderId||'').trim().toUpperCase();
  const patches=Array.isArray(body?.patches)?body.patches:[];
  if(!size||!productId||!patches.length||patches.length>12)return jsonError('Chọn size và ít nhất một patch.');
  try{
    const db=serviceDb(),patchIds=[...new Set(patches.map(x=>String(x?.patchId||'')).filter(Boolean))].slice(0,12);
    const [{data:product},{data:validPatches},{data:retention},{data:brandSetting}]=await Promise.all([
      db.from('products').select('id,sizes,price,product_type,min_patch_width_cm,max_patch_width_cm,min_patch_height_cm,max_patch_height_cm').eq('id',productId).eq('active',true).maybeSingle(),
      db.from('patches').select('id,name,price,width_cm,height_cm').in('id',patchIds).eq('active',true),
      db.from('settings').select('value').eq('key','retentionDays').maybeSingle(),
      db.from('settings').select('value').eq('key','brand').maybeSingle()
    ]);
    if(!product||!(product.sizes||[]).includes(size))return jsonError('Sản phẩm base hoặc size vừa thay đổi. Tải lại trang nhé.');
    if(!validPatches||validPatches.length!==patchIds.length)return jsonError('Một patch không còn khả dụng. Tải lại trang nhé.');
    if(validPatches.some(p=>!patchFitsProduct(p,product)))return jsonError('Có patch không đúng kích thước cho sản phẩm base này. Quay lại và chọn patch khác.');
    const allowedViews=productViews(product.product_type||'shirt',brandSetting?.value||{});
    // Prices always come from the database; legacy client gift flags are ignored.
    const mapped=patches.map(x=>{const p=validPatches.find(y=>y.id===x.patchId),view=allowedViews.includes(x.view)?x.view:'front',rotation=((Math.round(Number(x.rotation)||0)%360)+360)%360;return {id:p.id,name:p.name,price:Number(p.price)||0,view,rotation,x:Math.max(0,Math.min(1,Number(x.x)||0)),y:Math.max(0,Math.min(1,Number(x.y)||0))};});
    const productPrice=Number(product.price)||0,totalPrice=productPrice+mapped.reduce((sum,x)=>sum+x.price,0),expires=new Date(Date.now()+Number(retention?.value||30)*86400000).toISOString();
    const id=newId();
    const payload={id,customer_name:'',customer_phone:'',shipping_address:'',size,mode,product_id:productId,product_price:productPrice,total_price:totalPrice,patches:mapped,note,image_path:null,status:'processing',expires_at:expires};
    const {error}=await db.from('designs').insert(payload);
    if(error)throw error;
    return Response.json({id,status:'processing',createdAt:new Date().toISOString()});
  }catch(e){return jsonError(e.message||'Chưa tạo được mã đơn. Kiểm tra Supabase và thử lại.',503);}
}
