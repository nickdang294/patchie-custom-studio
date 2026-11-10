import {unstable_cache} from 'next/cache';
import {serviceDb} from './supabase';
import {CARD_COLUMNS,ENTRY_COLUMNS,PAGE_SIZE,uuid} from './storefront';
async function queryStorefront({kind,group='',offset=0},admin=false) {
  const db=serviceDb();
  if(!['collection','look'].includes(kind))throw new Error('Loại nội dung không hợp lệ.');
  if(group && !uuid(group))throw new Error('Nhóm không hợp lệ.');
  const {data:groups,error:ge}=await db.from('storefront_groups').select('id,name,sort_order,active').order('sort_order').order('id');
  if(ge)throw ge;
  let query=db.from('storefront_entries').select(admin?ENTRY_COLUMNS:CARD_COLUMNS).eq('kind',kind).order('sort_order').order('id');
  if(!admin)query=query.eq('active',true);
  if(group){if(!admin&&!groups.some(g=>g.id===group&&g.active))return {items:[],groups:[],hasMore:false};query=query.contains('group_ids',[group]);}
  const {data,error}=await query.range(offset,offset+PAGE_SIZE);
  if(error)throw error;
  // Small indexed existence probes: return only public groups with published content.
  let visibleGroups=groups;
  if(!admin)visibleGroups=(await Promise.all(groups.filter(g=>g.active).map(async g=>{const {data,error}=await db.from('storefront_entries').select('id').eq('kind',kind).eq('active',true).contains('group_ids',[g.id]).limit(1);if(error)throw error;return data.length?g:null;}))).filter(Boolean);
  return {items:data.slice(0,PAGE_SIZE),hasMore:data.length>PAGE_SIZE,groups:visibleGroups};
}
export async function storefrontDetail(id) {
  if(!uuid(id))return null;const db=serviceDb();
  const {data:item,error}=await db.from('storefront_entries').select(ENTRY_COLUMNS).eq('id',id).eq('active',true).maybeSingle();if(error)throw error;if(!item)return null;
  const ids=item.patch_items.map(x=>x.patch_id);
  const {data:patches,error:pe}=ids.length?await db.from('patches').select('id,name,thumbnail_url,image_url,width_cm,height_cm,active,stock_quantity,release_status').in('id',ids):{data:[],error:null};if(pe)throw pe;
  let design=null,related=null;
  if(item.product_design_id){const result=await db.from('product_designs').select('id,name,product_id,placements,active').eq('id',item.product_design_id).eq('active',true).maybeSingle();if(result.error)throw result.error;design=result.data;}
  if(item.related_collection_id){const result=await db.from('storefront_entries').select(CARD_COLUMNS).eq('id',item.related_collection_id).eq('kind','collection').eq('active',true).maybeSingle();if(result.error)throw result.error;related=result.data;}
  let relatedLooks=[];
  if(item.kind==='collection'){const r=await db.from('storefront_entries').select(CARD_COLUMNS).eq('kind','look').eq('active',true).eq('related_collection_id',id).order('sort_order').order('id').limit(6);if(r.error)throw r.error;relatedLooks=r.data;}
  return {item,patches,design,related,relatedLooks};
}

const cachedPublicList=unstable_cache((options)=>queryStorefront(options,false),['storefront-list-v1'],{revalidate:60,tags:['storefront']});
export function listStorefront(options,admin=false){return admin?queryStorefront(options,true):cachedPublicList(options);}
