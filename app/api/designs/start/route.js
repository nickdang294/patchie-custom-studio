import { serviceDb, jsonError } from '@/lib/supabase';

const VIEW_SETS={shirt:['front','left_sleeve','right_sleeve','back'],bag:['front','back']};
const newId=()=>`PCH-${crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase()}`;

export async function POST(request){
  let body;
  try{body=await request.json();}catch{return jsonError('Dữ liệu gửi lên không hợp lệ.');}
  const name=String(body?.name||'').trim().slice(0,80),phone=String(body?.phone||'').trim().slice(0,30),address=String(body?.address||'').trim().slice(0,500),size=String(body?.size||'').trim().slice(0,20),mode=body?.mode==='shop'?'shop':'diy';
  const productId=String(body?.productId||'').slice(0,80),note=String(body?.note||'').trim().slice(0,1200),requestedId=String(body?.orderId||'').trim().toUpperCase();
  const patches=Array.isArray(body?.patches)?body.patches:[];
  if(!name||!phone||!address||!size||!productId||!patches.length||patches.length>12||body?.consent!==true)return jsonError('Nhập tên, SĐT, địa chỉ, chọn size và patch, rồi xác nhận quyền riêng tư.');
  try{
    const db=serviceDb(),patchIds=[...new Set(patches.map(x=>String(x?.patchId||'')).filter(Boolean))].slice(0,12);
    const [{data:product},{data:validPatches},{data:retention},{data:giftSetting}]=await Promise.all([
      db.from('products').select('id,sizes,price,product_type').eq('id',productId).eq('active',true).maybeSingle(),
      db.from('patches').select('id,name,price').in('id',patchIds).eq('active',true),
      db.from('settings').select('value').eq('key','retentionDays').maybeSingle(),
      db.from('settings').select('value').eq('key','giftOffer').maybeSingle()
    ]);
    if(!product||!(product.sizes||[]).includes(size))return jsonError('Sản phẩm base hoặc size vừa thay đổi. Tải lại trang nhé.');
    if(!validPatches||validPatches.length!==patchIds.length)return jsonError('Một patch không còn khả dụng. Tải lại trang nhé.');
    const allowedViews=VIEW_SETS[product.product_type||'shirt']||VIEW_SETS.shirt;
    const giftOffer=giftSetting?.value||{},giftEnabled=giftOffer.enabled!==false,giftIds=Array.isArray(giftOffer.patchIds)?giftOffer.patchIds.filter(Boolean):[];
    let giftUsed=false;
    const mapped=patches.map(x=>{const p=validPatches.find(y=>y.id===x.patchId),view=allowedViews.includes(x.view)?x.view:'front',rotation=((Math.round(Number(x.rotation)||0)%360)+360)%360,isGift=Boolean(x.gift===true&&giftEnabled&&giftIds.includes(p.id)&&!giftUsed);if(isGift)giftUsed=true;return {id:p.id,name:p.name,price:isGift?0:Number(p.price)||0,gift:isGift,view,rotation,x:Math.max(0,Math.min(1,Number(x.x)||0)),y:Math.max(0,Math.min(1,Number(x.y)||0))};});
    const productPrice=Number(product.price)||0,totalPrice=productPrice+mapped.reduce((sum,x)=>sum+x.price,0),expires=new Date(Date.now()+Number(retention?.value||30)*86400000).toISOString();
    const preferred=/^PCH-[0-9A-F]{12}$/.test(requestedId)?requestedId:'';
    const payload=id=>({id,customer_name:name,customer_phone:phone,shipping_address:address,size,mode,product_id:productId,product_price:productPrice,total_price:totalPrice,patches:mapped,note,image_path:null,status:'processing',expires_at:expires});
    let id=preferred||newId(),{error}=await db.from('designs').insert(payload(id));
    if(error?.code==='23505'&&preferred){id=newId();({error}=await db.from('designs').insert(payload(id)));}
    if(error)throw error;
    return Response.json({id,status:'processing',createdAt:new Date().toISOString()});
  }catch(e){return jsonError(e.message||'Chưa tạo được mã đơn. Kiểm tra Supabase và thử lại.',503);}
}
