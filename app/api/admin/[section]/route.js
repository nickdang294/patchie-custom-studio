import { requireAdmin, serviceDb, jsonError } from '@/lib/supabase';

export async function GET(request,{params}) {
  const auth=await requireAdmin(); if(auth.error)return jsonError(auth.error,auth.status);
  const {section}=await params, db=serviceDb(), url=new URL(request.url);
  if(section==='bootstrap') return Response.json({email:auth.user.email});
  if(section==='settings') {const {data,error}=await db.from('settings').select('key,value');if(error)return jsonError(error.message,500);return Response.json({settings:Object.fromEntries(data.map(x=>[x.key,x.value]))});}
  if(section==='products'||section==='patches') {const {data,error}=await db.from(section).select('*').order(section==='patches'?'sort_order':'created_at');if(error)return jsonError(error.message,500);return Response.json({items:data});}
  if(section==='designs'||section==='summary') {
    const status=url.searchParams.get('status'), q=url.searchParams.get('q');
    let query=db.from('designs').select('*,products(name,price)').order('created_at',{ascending:false}).limit(100);
    if(status)query=query.eq('status',status);if(q)query=query.or(`id.ilike.%${q}%,customer_name.ilike.%${q}%`);
    const {data,error}=await query;if(error)return jsonError(error.message,500);
    if(section==='summary') {const counts={new:0,review:0,confirmed:0,completed:0,closed:0};(data||[]).forEach(x=>counts[x.status]=(counts[x.status]||0)+1);return Response.json({...counts,catalog:(await db.from('products').select('id',{count:'exact',head:true})).count+(await db.from('patches').select('id',{count:'exact',head:true})).count,recent:data.slice(0,8)});}
    const items=await Promise.all((data||[]).map(async d=>{const {data:file}=await db.storage.from('design-mockups').createSignedUrl(d.image_path,300);return {...d,imageUrl:file?.signedUrl||''};}));
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
  if(section==='settings') {for(const [key,value] of Object.entries(b)){const {error}=await db.from('settings').upsert({key,value},{onConflict:'key'});if(error)return jsonError(error.message,500);}return Response.json({ok:true});}
  if(section==='designs') {const {id,status}=b;if(!['new','review','confirmed','completed','closed'].includes(status))return jsonError('Trạng thái không hợp lệ.');const {error}=await db.from('designs').update({status}).eq('id',id);if(error)return jsonError(error.message,500);return Response.json({ok:true});}
  if(['products','patches'].includes(section)) {const item=b;const {id,...rest}=item;const {data,error}=await db.from(section).upsert(id?{id,...rest}:rest).select().single();if(error)return jsonError(error.message,500);return Response.json({item:data});}
  return jsonError('Không tìm thấy mục quản trị.',404);
}

export async function DELETE(request,{params}) {
  const auth=await requireAdmin();if(auth.error)return jsonError(auth.error,auth.status);
  const {section}=await params, id=new URL(request.url).searchParams.get('id');if(!id)return jsonError('Thiếu mã mục.');
  const db=serviceDb();
  if(section==='designs'){const {data}=await db.from('designs').select('image_path').eq('id',id).maybeSingle();if(data?.image_path)await db.storage.from('design-mockups').remove([data.image_path]);}
  if(!['designs','products','patches'].includes(section))return jsonError('Không thể xóa mục này.',404);
  const {error}=await db.from(section).delete().eq('id',id);if(error)return jsonError(error.message,500);return Response.json({ok:true});
}
