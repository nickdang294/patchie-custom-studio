export const PAGE_SIZE = 12;
export const ENTRY_COLUMNS = 'id,kind,name,description,group_ids,thumbnail_url,image_url,shopee_url,sale_type,includes_base,product_design_id,related_collection_id,patch_items,template,tone,image_mode,source_image_url,sort_order,active,updated_at';
export const CARD_COLUMNS = 'id,kind,name,group_ids,thumbnail_url,sort_order';
export function shopeeUrl(value) {
  try {const u = new URL(value);return u.protocol === 'https:' && !u.username && !u.password && /(^|\.)(shopee\.vn|shopee\.com|shp\.ee)$/.test(u.hostname) ? u.href : '';} catch {return '';}
}
export const buyLabel = item => item.kind === 'collection' ? 'Mua cả bộ trên Shopee' : item.sale_type === 'patch_set' ? 'Mua bộ patch trong hình' : item.sale_type === 'base' ? 'Mua phôi trên Shopee' : 'Mua mẫu này trên Shopee';
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function validateEntry(b) {
  if(!b || !['collection','look'].includes(b.kind))throw new Error('Loại nội dung không hợp lệ.');
  if(typeof b.name !== 'string' || !b.name.trim() || b.name.trim().length > 100)throw new Error('Tên cần từ 1 đến 100 ký tự.');
  if(typeof b.description !== 'string' || b.description.length > 2000)throw new Error('Mô tả tối đa 2000 ký tự.');
  if(b.id && !uuid(b.id))throw new Error('Mã nội dung không hợp lệ.');
  if(!Array.isArray(b.group_ids))throw new Error('Nhóm không hợp lệ.');
  const groups = [...new Set(b.group_ids || [])];
  if(groups.length > 20 || groups.some(id=>!uuid(id)))throw new Error('Nhóm không hợp lệ.');
  if(b.shopee_url && !shopeeUrl(b.shopee_url))throw new Error('Nhập link HTTPS sản phẩm Shopee hợp lệ.');
  const items = b.kind === 'collection' ? b.patch_items : [];
  if(!Array.isArray(items) || items.length > 60 || (b.kind === 'collection' && !items.length))throw new Error('Chọn từ 1 đến 60 loại patch cho bộ.');
  if(items.some(x=>!x || typeof x.patch_id !== 'string' || !x.patch_id || !Number.isInteger(x.quantity) || x.quantity < 1 || x.quantity > 20) || new Set(items.map(x=>x.patch_id)).size !== items.length)throw new Error('Mỗi patch chỉ chọn một lần, số lượng từ 1 đến 20.');
  if(b.related_collection_id && !uuid(b.related_collection_id))throw new Error('BST liên quan không hợp lệ.');
  if(!['stitched','sticker','minimal'].includes(b.template) || !['lavender','mint','peach'].includes(b.tone) || !['auto','upload'].includes(b.image_mode))throw new Error('Template không hợp lệ.');
  if(!['finished','patch_set','base'].includes(b.sale_type))throw new Error('Chọn loại sản phẩm bán.');
  return {kind:b.kind,name:b.name.trim(),description:b.description.trim(),group_ids:groups,patch_items:items.map(x=>({patch_id:x.patch_id,quantity:x.quantity})),shopee_url:shopeeUrl(b.shopee_url),sale_type:b.kind==='collection'?'patch_set':b.sale_type,includes_base:b.includes_base===true,product_design_id:b.kind==='look'?(String(b.product_design_id||'')||null):null,related_collection_id:b.kind==='look'?(b.related_collection_id||null):null,template:b.template,tone:b.tone,image_mode:b.image_mode,source_image_url:String(b.source_image_url||''),sort_order:Math.max(-10000,Math.min(10000,Math.trunc(Number(b.sort_order)||0))),active:b.active===true};
}
// Shelf packing in actual stage proportions. Never shrink patches to make a set fit.
export function packCollection(items, patches, product, view='front') {
  const refW=Number(product.reference_width_cm)||62.5,refH=Number(product.reference_height_cm)||62.5;
  const fw=Math.min(100,Number(product.image_fit_percent)||100)/100,fh=Math.min(100,Number(product.image_fit_height_percent)||Number(product.image_fit_percent)||100)/100;
  let x=.12,y=.12,row=0;const placements=[],remaining=[];
  for(const item of items){const p=patches.find(p=>p.id===item.patch_id);const w=Number(p?.width_cm)/refW*fw,h=Number(p?.height_cm)/refH*fh;
    for(let i=0;i<item.quantity;i++){
      if(!p || !Number.isFinite(w) || !Number.isFinite(h) || w<=0 || h<=0 || w>.76 || h>.76){remaining.push(item.patch_id);continue;}
      if(x+w>.88){x=.12;y+=row+.025;row=0;}
      if(y+h>.88){remaining.push(item.patch_id);continue;}
      placements.push({patch_id:p.id,view,x:x+w/2,y:y+h/2,rotation:0});x+=w+.025;row=Math.max(row,h);
    }
  }return {placements,remaining};
}
