import { serviceDb, jsonError } from '@/lib/supabase';

export const dynamic='force-dynamic';

export async function POST(request){
  let body;
  try{body=await request.json();}catch{return jsonError('Dữ liệu đơn hàng không hợp lệ.');}
  const name=String(body?.customer_name||'').trim().slice(0,120);
  const phone=String(body?.customer_phone||'').trim().slice(0,40);
  const address=String(body?.shipping_address||'').trim().slice(0,1000);
  const note=String(body?.note||'').trim().slice(0,1200);
  const requested=Array.isArray(body?.items)?body.items:[];
  if(!name||!phone||!address)return jsonError('Vui lòng nhập tên, số điện thoại và địa chỉ.');
  if(!requested.length)return jsonError('Giỏ hàng đang trống.');
  const items=requested.map(item=>({patch_id:String(item?.patch_id||'').trim(),quantity:Math.max(1,Math.min(99,Number(item?.quantity)||1))})).filter(item=>item.patch_id);
  if(!items.length)return jsonError('Giỏ hàng không có patch hợp lệ.');
  try{
    const db=serviceDb();
    const {data:result,error}=await db.rpc('create_patch_order',{p_customer_name:name,p_customer_phone:phone,p_shipping_address:address,p_note:note,p_items:items});
    if(error){
      const message=error.message||'Chưa tạo được đơn patch.';
      return jsonError(message,/chỉ còn|không còn bán|giỏ hàng/i.test(message)?409:500);
    }
    const id=result?.id,total_price=Number(result?.total_price)||0,rows=Array.isArray(result?.items)?result.items:[];
    const lines=rows.map(row=>`- ${row.name} × ${row.quantity} · ${new Intl.NumberFormat('vi-VN').format(Number(row.line_total)||0)}đ`).join('\n');
    const message=`Chào Patchie! Mình muốn mua patch riêng.\nMã đơn: ${id}\nTên: ${name}\nSĐT: ${phone}\nĐịa chỉ: ${address}\nPatch:\n${lines}\nTổng tạm tính: ${new Intl.NumberFormat('vi-VN').format(total_price)}đ\nGhi chú: ${note||'Không có'}`;
    return Response.json({id,total_price,message});
  }catch(error){return jsonError(error.message||'Chưa tạo được đơn patch.',503);}
}
