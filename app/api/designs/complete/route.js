import { serviceDb, jsonError } from '@/lib/supabase';

export async function POST(request){
  let form;
  try{form=await request.formData();}catch{return jsonError('Dữ liệu mockup không hợp lệ.');}
  const id=String(form.get('id')||'').trim().toUpperCase(),phone=String(form.get('phone')||'').trim().slice(0,30),mockup=form.get('mockup');
  if(!/^PCH-[0-9A-F]{12}$/.test(id)||!phone)return jsonError('Mã đơn hoặc số điện thoại không hợp lệ.');
  if(!(mockup instanceof File)||!['image/webp','image/png'].includes(mockup.type)||mockup.size>3_000_000)return jsonError('Mockup không hợp lệ hoặc lớn hơn 3 MB.');
  try{
    const db=serviceDb(),{data:design,error:findError}=await db.from('designs').select('id').eq('id',id).eq('customer_phone',phone).eq('status','processing').maybeSingle();
    if(findError)throw findError;
    if(!design)return jsonError('Mã đơn không còn ở trạng thái đang xử lý.',409);
    const path=`${id}.${mockup.type==='image/webp'?'webp':'png'}`;
    const {error:uploadError}=await db.storage.from('design-mockups').upload(path,mockup,{contentType:mockup.type,upsert:true});
    if(uploadError)throw uploadError;
    const {error:updateError}=await db.from('designs').update({image_path:path,status:'new'}).eq('id',id).eq('status','processing');
    if(updateError){await db.storage.from('design-mockups').remove([path]);throw updateError;}
    return Response.json({id,status:'new'});
  }catch(e){return jsonError(e.message||'Chưa lưu được mockup. Shop có thể nhận lại sau ít phút.',503);}
}
