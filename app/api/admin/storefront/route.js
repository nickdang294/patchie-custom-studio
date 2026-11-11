import {revalidateTag} from 'next/cache';
import {requireAdmin,serviceDb,jsonError} from '@/lib/supabase';
import {validateEntry,uuid,ENTRY_COLUMNS} from '@/lib/storefront';
import {listStorefront} from '@/lib/storefront-server';
import {createStorefrontImages} from '@/lib/storefront-images';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request){const auth=await requireAdmin();if(auth.error)return jsonError(auth.error,auth.status);
 try{const q=new URL(request.url).searchParams,db=serviceDb();
 if(q.get('action')==='groups'){const {data,error}=await db.from('storefront_groups').select('*').order('sort_order').order('id');if(error)throw error;return Response.json({items:data});}
 if(q.get('action')==='names'){
 const id=q.get('id');if(!uuid(id))return jsonError('Mã không hợp lệ.');
 const {data:e,error}=await db.from('storefront_entries').select('patch_items,product_design_id,related_collection_id').eq('id',id).single();if(error)throw error;
 const names={};for(const [table,ids] of [['patches',e.patch_items.map(p=>p.patch_id)],['product_designs',[e.product_design_id].filter(Boolean)],['storefront_entries',[e.related_collection_id].filter(Boolean)]]){if(!ids.length)continue;const r=await db.from(table).select('id,name').in('id',ids);if(r.error)throw r.error;for(const x of r.data)names[x.id]=x.name;}
 return Response.json({names});
 }
 if(q.get('action')==='choices'){
  const table=q.get('type')==='patch'?'patches':q.get('type')==='collection'?'storefront_entries':'product_designs';
  const fields=table==='patches'?'id,name,thumbnail_url,image_url':table==='product_designs'?'id,name,thumbnail_url,shopee_url,placements':'id,name,thumbnail_url,patch_items';
  let query=db.from(table).select(fields).order('name').order('id').limit(40);
  if(table==='storefront_entries')query=query.eq('kind','collection');
  const term=(q.get('q')||'').slice(0,80).replace(/[%_]/g,'');if(term)query=query.ilike('name',`%${term}%`);
  const {data,error}=await query;if(error)throw error;return Response.json({items:data});
 }
 return Response.json(await listStorefront({kind:q.get('kind'),offset:Math.max(0,Math.min(100000,parseInt(q.get('offset'))||0))},true));
 }catch(e){return jsonError(e.message||'Không tải được nội dung.',500);}}
export async function POST(request){const auth=await requireAdmin();if(auth.error)return jsonError(auth.error,auth.status);
 try{const b=await request.json(),db=serviceDb();
 if(b.action==='group'){
  if(typeof b.name!=='string'||!b.name.trim()||b.name.length>60||(b.id&&!uuid(b.id)))return jsonError('Tên nhóm tối đa 60 ký tự.');
  const {data,error}=await db.from('storefront_groups').upsert({id:b.id||crypto.randomUUID(),name:b.name.trim(),active:b.active===true,sort_order:Math.max(-10000,Math.min(10000,Math.trunc(Number(b.sort_order)||0)))}).select().single();if(error)throw error;revalidateTag('storefront');return Response.json({item:data});
 }
 if(!['save','preview','visibility'].includes(b.action))return jsonError('Thao tác không hợp lệ.');
 if(b.action==='visibility'&&!uuid(b.id))return jsonError('Chọn nội dung cần ẩn.');
 const entry=validateEntry(b);
 if(b.id){const {data,error}=await db.from('storefront_entries').select('id,kind').eq('id',b.id).maybeSingle();if(error)throw error;if(!data||data.kind!==entry.kind)return jsonError('Không tìm thấy nội dung.',404);}
 if(entry.group_ids.length){const {data,error}=await db.from('storefront_groups').select('id').in('id',entry.group_ids);if(error)throw error;if(data.length!==entry.group_ids.length)return jsonError('Nhóm đã thay đổi. Tải lại trang.');}
 if(entry.patch_items.length){const {data,error}=await db.from('patches').select('id').in('id',entry.patch_items.map(x=>x.patch_id));if(error)throw error;if(data.length!==entry.patch_items.length)return jsonError('Có patch đã bị xóa.');}
 if(entry.product_design_id){const {data,error}=await db.from('product_designs').select('id').eq('id',entry.product_design_id).maybeSingle();if(error)throw error;if(!data)return jsonError('Mẫu phối không tồn tại.');}
 if(entry.related_collection_id){const {data,error}=await db.from('storefront_entries').select('id').eq('id',entry.related_collection_id).eq('kind','collection').maybeSingle();if(error)throw error;if(!data)return jsonError('BST liên quan không tồn tại.');}
 if(b.action==='visibility'){const {data,error}=await db.from('storefront_entries').update({active:entry.active,updated_at:new Date().toISOString()}).eq('id',b.id).select(ENTRY_COLUMNS).single();if(error)throw error;revalidateTag('storefront');return Response.json({item:data});}
 const {large,thumbnail}=await createStorefrontImages(entry,db);
 if(b.action==='preview')return Response.json({image:`data:image/webp;base64,${large.toString('base64')}`,thumbnailBytes:thumbnail.length});
 const id=b.id||crypto.randomUUID(),prefix=`storefront/${id}/${crypto.randomUUID()}`;
 const bucket=db.storage.from('patch-assets'),paths=[`${prefix}.webp`,`${prefix}-thumb.webp`];
 try{
  for(const [i,bytes] of [large,thumbnail].entries()){const {error}=await bucket.upload(paths[i],bytes,{contentType:'image/webp',cacheControl:'31536000',upsert:false});if(error)throw error;}
  const {data,error}=await db.from('storefront_entries').upsert({...entry,id,image_url:bucket.getPublicUrl(paths[0]).data.publicUrl,thumbnail_url:bucket.getPublicUrl(paths[1]).data.publicUrl,updated_at:new Date().toISOString()}).select(ENTRY_COLUMNS).single();if(error)throw error;
  revalidateTag('storefront');return Response.json({item:data});
 }catch(error){await bucket.remove(paths);throw error;}
 }catch(e){return jsonError(e.message||'Không lưu được nội dung.',400);}}
export async function DELETE(request){const auth=await requireAdmin();if(auth.error)return jsonError(auth.error,auth.status);
 try{const id=new URL(request.url).searchParams.get('id');if(!uuid(id))return jsonError('Mã BST không hợp lệ.');const db=serviceDb();const {data:item,error:readError}=await db.from('storefront_entries').select('id,kind,image_url,thumbnail_url').eq('id',id).maybeSingle();if(readError)throw readError;if(!item||item.kind!=='collection')return jsonError('Không tìm thấy BST.',404);
 const {data:linked,error:linkedError}=await db.from('storefront_entries').select('id').eq('kind','look').eq('related_collection_id',id);if(linkedError)throw linkedError;
 if(linked?.length){const {error}=await db.from('storefront_entries').update({related_collection_id:null,updated_at:new Date().toISOString()}).in('id',linked.map(x=>x.id));if(error)throw error;}
 const paths=[item.image_url,item.thumbnail_url].map(value=>{try{const u=new URL(value);const marker='/storage/v1/object/public/patch-assets/';return u.origin===new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin&&u.pathname.includes(marker)?decodeURIComponent(u.pathname.split(marker)[1]):null;}catch{return null;}}).filter(Boolean);
 const {error:deleteError}=await db.from('storefront_entries').delete().eq('id',id);if(deleteError)throw deleteError;if(paths.length)await db.storage.from('patch-assets').remove(paths);revalidateTag('storefront');return Response.json({ok:true});
 }catch(e){return jsonError(e.message||'Không xóa được BST.',500);}}
