import { requireAdmin, serviceDb, jsonError } from '@/lib/supabase';

export async function GET(request,{params}) {
  const auth=await requireAdmin(); if(auth.error)return jsonError(auth.error,auth.status);
  const {section}=await params, db=serviceDb(), url=new URL(request.url);
  if(section==='bootstrap') return Response.json({email:auth.user.email});
  if(section==='settings') {const {data,error}=await db.from('settings').select('key,value');if(error)return jsonError(error.message,500);return Response.json({settings:Object.fromEntries(data.map(x=>[x.key,x.value]))});}
  if(section==='patch-orders') {const {data,error}=await db.from('patch_orders').select('*,patch_order_items(*)').order('created_at',{ascending:false}).limit(200);if(error)return jsonError(error.message,500);return Response.json({items:data||[]});}
  if(section==='products'||section==='patches') {let query=db.from(section).select('*');query=section==='patches'?query.order('patch_group').order('sort_order'):query.order('created_at');const {data,error}=await query;if(error)return jsonError(error.message,500);return Response.json({items:data});}
  if(section==='designs'||section==='summary') {
    const status=url.searchParams.get('status'), q=url.searchParams.get('q');
    let query=db.from('designs').select('*,products(name,price)').order('created_at',{ascending:false}).limit(100);
    if(status)query=query.eq('status',status);if(q)query=query.or(`id.ilike.%${q}%,customer_name.ilike.%${q}%`);
    const {data,error}=await query;if(error)return jsonError(error.message,500);
    if(section==='summary') {const counts={processing:0,new:0,review:0,confirmed:0,completed:0,closed:0};(data||[]).forEach(x=>counts[x.status]=(counts[x.status]||0)+1);return Response.json({...counts,catalog:(await db.from('products').select('id',{count:'exact',head:true})).count+(await db.from('patches').select('id',{count:'exact',head:true})).count,recent:data.slice(0,8)});}
    const items=await Promise.all((data||[]).map(async d=>{const {data:file}=d.image_path?await db.storage.from('design-mockups').createSignedUrl(d.image_path,300):{data:null};return {...d,imageUrl:file?.signedUrl||''};}));
    return Response.json({items});
  }
  return jsonError('Không tìm thấy mục quản trị.',404);
}

export async function POST(request,{params}) {
  const auth=await requireAdmin();if(auth.error)return jsonError(auth.error,auth.status);
  const {section}=await params, db=serviceDb();
  if(section==='upload'){
    const f=await request.formData(),file=f.get('file');if(!(file instanceof File)||file.size>4*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))return jsonError('Chọn PNG, JPG hoặc WebP tối đa 4 MB.');
    const ext=file.type.split('/')[1].replace('jpeg','jpg'),path=`${crypto.randomUUID()}.${ext}`;
    const {error}=await db.storage.from('patch-assets').upload(path,file,{contentType:file.type,upsert:false});if(error)return jsonError(error.message,500);
    const {data}=db.storage.from('patch-assets').getPublicUrl(path);return Response.json({image_url:data.publicUrl});
  }
  let b={};try{b=await request.json();}catch{return jsonError('Dữ liệu không hợp lệ.');}
  if(section==='settings') {
    if(b.brand?.productGroups){
      const groups=b.brand.productGroups;
      const ids=groups.map(group=>String(group?.id||group?.value||'').trim()).filter(Boolean);
      const labels=groups.map(group=>String(group?.label||'').trim().toLocaleLowerCase());
      if(!groups.length||ids.length!==groups.length||new Set(ids).size!==ids.length||labels.some(label=>!label)||new Set(labels).size!==labels.length)return jsonError('Nhóm sản phẩm phải có id và tên riêng biệt.',400);
      const {data:previous}=await db.from('settings').select('value').eq('key','brand').maybeSingle();
      const previousGroups=Array.isArray(previous?.value?.productGroups)?previous.value.productGroups:[];
      for(const group of groups){
        const id=String(group.id||group.value).trim(),old=previousGroups.find(item=>String(item?.id||item?.value||'').trim()===id);
        if(old?.label&&String(old.label).trim()!==String(group.label).trim()){
          const {error}=await db.from('products').update({product_type:id}).eq('product_type',String(old.label).trim());
          if(error)return jsonError(`Không cập nhật được sản phẩm thuộc nhóm ${old.label}: ${error.message}`,500);
        }
      }
    }
    for(const [key,value] of Object.entries(b)){const {error}=await db.from('settings').upsert({key,value},{onConflict:'key'});if(error)return jsonError(error.message,500);}
    return Response.json({ok:true});
  }
  if(section==='designs') {const {id,status}=b;if(!['processing','new','review','confirmed','completed','closed'].includes(status))return jsonError('Trạng thái không hợp lệ.');const {error}=await db.from('designs').update({status}).eq('id',id);if(error)return jsonError(error.message,500);return Response.json({ok:true});}
  if(section==='patch-orders') {const {id,status}=b;if(!id||!['new','confirmed','completed','closed'].includes(status))return jsonError('Trạng thái đơn không hợp lệ.');const {error}=await db.from('patch_orders').update({status}).eq('id',id);if(error)return jsonError(error.message,500);return Response.json({ok:true});}
  if(section==='patch-groups') {
    const ids=Array.isArray(b.ids)?b.ids.filter(Boolean):[],incoming=(Array.isArray(b.patch_groups)?b.patch_groups:String(b.patch_groups||b.patch_group||'').split(',')).map(x=>String(x).trim()).filter(Boolean);
    if(!ids.length||!incoming.length)return jsonError('Chọn patch và group cần thêm.');
    const {data,error:readError}=await db.from('patches').select('id,patch_group,patch_groups').in('id',ids);if(readError)return jsonError(readError.message,500);
    const updates=(data||[]).map(p=>{const groups=Array.from(new Set([...(Array.isArray(p.patch_groups)&&p.patch_groups.length?p.patch_groups:[p.patch_group||'Best Seller']),...incoming].map(x=>String(x).trim()).filter(Boolean)));return db.from('patches').update({patch_groups:groups,patch_group:groups[0]||'Best Seller'}).eq('id',p.id);});
    const results=await Promise.all(updates);const failed=results.find(r=>r.error);if(failed)return jsonError(failed.error.message,500);
    return Response.json({ok:true,count:ids.length});
  }
  if(['products','patches'].includes(section)) {
    const item=b;const {id,...rest}=item;
    let result=await db.from(section).upsert(id?{id,...rest}:rest).select().single();
    // Keep older projects usable until the one-line base_key migration is run.
    if(result.error&&section==='products'&&/base_key/i.test(result.error.message)){
      const legacy={...rest};delete legacy.base_key;
      result=await db.from(section).upsert(id?{id,...legacy}:legacy).select().single();
    }
    if(result.error)return jsonError(result.error.message,500);return Response.json({item:result.data});
  }
  return jsonError('Không tìm thấy mục quản trị.',404);
}

export async function DELETE(request,{params}) {
  const auth=await requireAdmin();if(auth.error)return jsonError(auth.error,auth.status);
  const {section}=await params, id=new URL(request.url).searchParams.get('id');if(!id)return jsonError('Thiếu mã mục.');
  const db=serviceDb();
  if(section==='designs'){const {data}=await db.from('designs').select('image_path').eq('id',id).maybeSingle();if(data?.image_path)await db.storage.from('design-mockups').remove([data.image_path]);}
  if(!['designs','products','patches','patch-orders'].includes(section))return jsonError('Không thể xóa mục này.',404);
  if(section==='patch-orders'){
    const {error:itemError}=await db.from('patch_order_items').delete().eq('order_id',id);
    if(itemError)return jsonError(itemError.message,500);
    const {error:orderError}=await db.from('patch_orders').delete().eq('id',id);
    if(orderError)return jsonError(orderError.message,500);
    return Response.json({ok:true});
  }
  const {error}=await db.from(section).delete().eq('id',id);
  if(error&&section==='patches'&&/foreign key|violates.*constraint|referenced/i.test(error.message||'')){
    const {error:archiveError}=await db.from('patches').update({active:false}).eq('id',id);
    if(!archiveError)return Response.json({ok:true,archived:true});
  }
  if(error)return jsonError(error.message,500);return Response.json({ok:true});
}
