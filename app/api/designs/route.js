import { serviceDb, jsonError } from '@/lib/supabase';

const VIEW_SETS={shirt:['front','left_sleeve','right_sleeve','back'],bag:['front','back']};

export async function POST(request) {
  let form;
  try { form=await request.formData(); } catch { return jsonError('Dữ liệu gửi lên không hợp lệ.'); }
  const name=String(form.get('name')||'').trim().slice(0,80), phone=String(form.get('phone')||'').trim().slice(0,30), address=String(form.get('address')||'').trim().slice(0,500), size=String(form.get('size')||'').trim().slice(0,20), mode=form.get('mode')==='shop'?'shop':'diy';
  const productId=String(form.get('productId')||'').slice(0,80), note=String(form.get('note')||'').trim().slice(0,1200), requestedId=String(form.get('orderId')||'').trim().toUpperCase();
  let patches; try { patches=JSON.parse(form.get('patches')||'[]'); } catch { return jsonError('Danh sách patch không hợp lệ.'); }
  const mockup=form.get('mockup');
  if (!name || !phone || !address || !size || !productId || !Array.isArray(patches) || !patches.length || patches.length>12 || form.get('consent')!=='true') return jsonError('Nhập tên, SĐT, địa chỉ, chọn size và patch, rồi xác nhận quyền riêng tư.');
  if (!(mockup instanceof File) || mockup.type!=='image/png' || mockup.size>3_000_000) return jsonError('Mockup PNG không hợp lệ hoặc lớn hơn 3 MB.');
  try {
    const db=serviceDb();
    const patchIds=[...new Set(patches.map(x=>String(x.patchId||'')).filter(Boolean))].slice(0,12);
    const [{data:product},{data:validPatches}] = await Promise.all([
      db.from('products').select('id,sizes,price,product_type').eq('id',productId).eq('active',true).maybeSingle(),
      db.from('patches').select('id,name,price').in('id',patchIds).eq('active',true)
    ]);
    if (!product || !(product.sizes||[]).includes(size)) return jsonError('Sản phẩm base hoặc size vừa thay đổi. Tải lại trang nhé.');
    if (!validPatches || validPatches.length!==patchIds.length) return jsonError('Một patch không còn khả dụng. Tải lại trang nhé.');
    const allowedViews=VIEW_SETS[product.product_type||'shirt']||VIEW_SETS.shirt;
    const mapped=patches.map(x=>{const p=validPatches.find(y=>y.id===x.patchId),view=allowedViews.includes(x.view)?x.view:'front',rotation=((Math.round(Number(x.rotation)||0)%360)+360)%360;return {id:p.id,name:p.name,price:Number(p.price)||0,view,rotation,x:Math.max(0,Math.min(1,Number(x.x)||0)),y:Math.max(0,Math.min(1,Number(x.y)||0))};});
    const productPrice=Number(product.price)||0,totalPrice=productPrice+mapped.reduce((sum,x)=>sum+x.price,0);
    const id=/^PCH-[0-9A-F]{12}$/.test(requestedId)?requestedId:'PCH-'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase();
    const path=`${id}.png`;
    const [{error:upErr},{data:retention}]=await Promise.all([
      db.storage.from('design-mockups').upload(path, mockup, {contentType:'image/png',upsert:false}),
      db.from('settings').select('value').eq('key','retentionDays').maybeSingle()
    ]);
    if(upErr) throw upErr;
    const expires=new Date(Date.now()+Number(retention?.value||30)*86400000).toISOString();
    const {error}=await db.from('designs').insert({id,customer_name:name,customer_phone:phone,shipping_address:address,size,mode,product_id:productId,product_price:productPrice,total_price:totalPrice,patches:mapped,note,image_path:path,status:'new',expires_at:expires});
    if(error){await db.storage.from('design-mockups').remove([path]);throw error;}
    return Response.json({id,createdAt:new Date().toISOString()});
  } catch(e) { return jsonError(e.message||'Chưa lưu được thiết kế. Kiểm tra Supabase và thử lại.',503); }
}
