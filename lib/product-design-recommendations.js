// A product ID is one base/color variant. Match count ranks, never excludes,
// so available designs of that exact variant can fill the remaining places.
export function selectProductDesignRecommendations(designs,patches,selectedIds,productId){
  const selected=new Set(selectedIds.map(String));
  const patchMap=new Map(patches.map(p=>[String(p.id),p]));
  return designs.filter(d=>d.active&&String(d.product_id)===String(productId)&&Array.isArray(d.placements)&&d.placements.length>0)
    .map(d=>{
      const ids=[...new Set(d.placements.map(p=>String(p.patch_id)))];
      const available=ids.every(id=>{
        const p=patchMap.get(id);
        return p&&p.active&&Number(p.stock_quantity??20)>0&&p.release_status==='released';
      });
      return {id:d.id,name:d.name,shopee_url:d.shopee_url||'',product_id:d.product_id,thumbnail_url:d.thumbnail_url,placements:d.placements,
        priority:Number(d.priority)||0,match_count:ids.filter(id=>selected.has(id)).length,total_patches:ids.length,available};
    }).filter(d=>d.available)
    .sort((a,b)=>b.match_count-a.match_count||b.priority-a.priority||a.name.localeCompare(b.name,'vi'))
    .slice(0,9);
}
