import { serviceDb, jsonError } from '@/lib/supabase';

export const dynamic='force-dynamic';

export async function POST(request){
  let body;
  try{body=await request.json();}catch{return jsonError('Dữ liệu đơn hàng không hợp lệ.');}
  const name=String(body?.customer_name||'').trim();
  const phone=String(body?.customer_phone||'').trim();
  const address=String(body?.shipping_address||'').trim();
  const note=String(body?.note||'').trim();
  const requested=Array.isArray(body?.items)?body.items:[];
  if(!name||!phone||!address)return jsonError('Vui lòng nhập tên, số điện thoại và địa chỉ.');
  if(!requested.length)return jsonError('Giỏ hàng đang trống.');
  const quantities=new Map();
  for(const item of requested){
    const id=String(item?.patch_id||'').trim(),quantity=Math.max(1,Math.min(99,Number(item?.quantity)||1));
    if(id)quantities.set(id,(quantities.get(id)||0)+quantity);
  }
  if(!quantities.size)return jsonError('Giỏ hàng không có patch hợp lệ.');
  const db=serviceDb();
  const ids=[...quantities.keys()];
  const {data:patches,error:patchError}=await db.from('patches').select('*').in('id',ids).eq('active',true);
  if(patchError)return jsonError(patchError.message,500);
  if((patches||[]).length!==ids.length)return jsonError('Một patch trong giỏ không còn bán.');
  const rows=[];
  for(const patch of patches){
    const quantity=quantities.get(patch.id)||0;
    const stock=Number.isFinite(Number(patch.stock_quantity))?Number(patch.stock_quantity):999999;
    if(stock<quantity)return jsonError(`${patch.name} chỉ còn ${stock} cái.`);
    const unit=Number.isFinite(Number(patch.price))?Number(patch.price):0;
    rows.push({patch,quantity,unit,line_total:unit*quantity});
  }
  const total_price=rows.reduce((sum,row)=>sum+row.line_total,0);
  const id=`PM-${Math.random().toString(36).slice(2,8).toUpperCase()}${Date.now().toString(36).slice(-3).toUpperCase()}`;
  const {error:orderError}=await db.from('patch_orders').insert({id,customer_name:name,customer_phone:phone,shipping_address:address,total_price,note});
  if(orderError)return jsonError(orderError.message,500);
  const itemRows=rows.map(row=>({order_id:id,patch_id:row.patch.id,patch_name:row.patch.name,quantity:row.quantity,unit_price:row.unit,line_total:row.line_total}));
  const {error:itemError}=await db.from('patch_order_items').insert(itemRows);
  if(itemError){await db.from('patch_orders').delete().eq('id',id);return jsonError(itemError.message,500);}
  for(const row of rows){
    const stock=Number.isFinite(Number(row.patch.stock_quantity))?Number(row.patch.stock_quantity):999999;
    const sold=Number.isFinite(Number(row.patch.sold_count))?Number(row.patch.sold_count):0;
    const {error:updateError}=await db.from('patches').update({stock_quantity:Math.max(0,stock-row.quantity),sold_count:sold+row.quantity}).eq('id',row.patch.id).gte('stock_quantity',row.quantity);
    if(updateError)return jsonError(updateError.message,500);
  }
  const lines=rows.map(row=>`- ${row.patch.name} × ${row.quantity} · ${new Intl.NumberFormat('vi-VN').format(row.line_total)}đ`).join('\n');
  const message=`Chào Patchie! Mình muốn mua patch riêng.\nMã đơn: ${id}\nTên: ${name}\nSĐT: ${phone}\nĐịa chỉ: ${address}\nPatch:\n${lines}\nTổng tạm tính: ${new Intl.NumberFormat('vi-VN').format(total_price)}đ\nGhi chú: ${note||'Không có'}`;
  return Response.json({id,total_price,message});
}
