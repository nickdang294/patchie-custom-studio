import { serviceDb, jsonError } from '@/lib/supabase';

export async function POST(request) {
  let form;
  try { form=await request.formData(); } catch { return jsonError('Dữ liệu gửi lên không hợp lệ.'); }
  const name=String(form.get('name')||'').trim().slice(0,80), size=String(form.get('size')||'').trim().slice(0,20), mode=form.get('mode')==='shop'?'shop':'diy';
  const productId=String(form.get('productId')||'').slice(0,80), note=String(form.get('note')||'').trim().slice(0,1200);
  let patches; try { patches=JSON.parse(form.get('patches')||'[]'); } catch { return jsonError('Danh sách patch không hợp lệ.'); }
  const mockup=form.get('mockup');
  if (!name || !size || !productId || !Array.isArray(patches) || !patches.length || patches.length>6 || form.get('consent')!=='true') return jsonError('Nhập tên, chọn size và patch, rồi xác nhận quyền riêng tư.');
  if (!(mockup instanceof File) || mockup.type!=='image/png' || mockup.size>3_000_000) return jsonError('Mockup PNG không hợp lệ hoặc lớn hơn 3 MB.');
  try {
    const db=serviceDb();
    const [{data:product},{data:validPatches}] = await Promise.all([
      db.from('products').select('id,sizes').eq('id',productId).eq('active',true).maybeSingle(),
      db.from('patches').select('id,name').in('id',patches.map(x=>String(x.patchId||'')).slice(0,6)).eq('active',true)
    ]);
    if (!product || !(product.sizes||[]).includes(size)) return jsonError('Mẫu áo hoặc size vừa thay đổi. Tải lại trang nhé.');
    if (!validPatches || validPatches.length!==patches.length) return jsonError('Một patch không còn khả dụng. Tải lại trang nhé.');
    const mapped=patches.map(x=>{const p=validPatches.find(y=>y.id===x.patchId);return {id:p.id,name:p.name,x:Math.max(0,Math.min(1,Number(x.x)||0)),y:Math.max(0,Math.min(1,Number(x.y)||0))};});
    const id='PCH-'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase();
    const path=`${id}.png`;
    const {error:upErr}=await db.storage.from('design-mockups').upload(path, mockup, {contentType:'image/png',upsert:false});
    if(upErr) throw upErr;
    const {data:retention}=await db.from('settings').select('value').eq('key','retentionDays').maybeSingle();
    const expires=new Date(Date.now()+Number(retention?.value||30)*86400000).toISOString();
    const {error}=await db.from('designs').insert({id,customer_name:name,size,mode,product_id:productId,patches:mapped,note,image_path:path,status:'new',expires_at:expires});
    if(error){await db.storage.from('design-mockups').remove([path]);throw error;}
    return Response.json({id,createdAt:new Date().toISOString()});
  } catch(e) { return jsonError(e.message||'Chưa lưu được thiết kế. Kiểm tra Supabase và thử lại.',503); }
}
