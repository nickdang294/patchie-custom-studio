import sharp from 'sharp';
import {outlinedText} from './storefront-text.js';
// Crop only near-white outer margins; never erase white pixels inside the product.
export async function trimLookMargins(bytes){
 const normalized=await sharp(bytes,{limitInputPixels:25000000}).rotate().flatten({background:'#fff'}).png().toBuffer();
 const meta=await sharp(normalized).metadata();
 const {data,info}=await sharp(normalized).trim({background:'#ffffff',threshold:6}).toBuffer({resolveWithObject:true});
 if(info.width<8||info.height<8)return normalized;
 // Restore a little breathing room for thin hooks, pale edges and shadows.
 const pad=Math.max(6,Math.round(Math.max(meta.width,meta.height)*.025));
 return sharp(data).extend({top:pad,bottom:pad,left:pad,right:pad,background:'#fff'}).png().toBuffer();
}
export async function createLookCover(bytes,entry){
 const palette={lavender:['#eee6f6','#baa5d0','#644f79'],mint:['#e4eee6','#9fbda9','#426556'],peach:['#f5e6dd','#d8ae9b','#785344']};
 const [bg,accent,ink]=palette[entry.tone];
 const label=await outlinedText('GÓC PHỐI XINH',{x:70,y:84,size:23,fill:ink,bold:true});
 const brand=await outlinedText('patchie',{x:988,y:84,size:32,fill:ink,bold:true,maxWidth:145});
 const stitch=entry.template==='stitched'?`<rect x="40" y="119" width="1120" height="1041" rx="83" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="10 9"/>`:'';
 const accents=entry.template==='minimal'?'':`<path d="M1094 165 Q1099 187 1121 192 Q1099 197 1094 219 Q1089 197 1067 192 Q1089 187 1094 165Z" fill="${accent}"/><circle cx="97" cy="1096" r="10" fill="${accent}"/>`;
 const backdrop=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect width="1200" height="1200" rx="48" fill="${bg}"/>${label}${brand}<rect x="58" y="151" width="1084" height="1005" rx="72" fill="${accent}" opacity=".28"/><rect x="54" y="135" width="1092" height="1005" rx="72" fill="white" stroke="${accent}" stroke-width="2"/>${stitch}${accents}</svg>`;
 const product=await sharp(await trimLookMargins(bytes)).resize(940,920,{fit:'inside'}).png().toBuffer({resolveWithObject:true});
 return sharp(Buffer.from(backdrop)).composite([{input:product.data,left:Math.round((1200-product.info.width)/2),top:Math.round(638-product.info.height/2)}]).png().toBuffer();
}
// Render at cover resolution only on admin save/preview, not on customer page loads.
export async function renderLookDesign(design,db,loadImage){
 const placements=Array.isArray(design.placements)?design.placements:[];
 const view=placements.some(p=>p.view==='front')?'front':placements[0]?.view||'front';
 const visible=placements.filter(p=>(p.view||'front')===view);
 const ids=[...new Set(visible.map(p=>p.patch_id))];
 const [baseResult,patchResult]=await Promise.all([
  db.from('products').select('image_url,view_images,reference_width_cm,reference_height_cm,image_fit_percent,image_fit_height_percent').eq('id',design.product_id).maybeSingle(),
  ids.length?db.from('patches').select('id,image_url,width_cm,height_cm').in('id',ids):Promise.resolve({data:[]})
 ]);
 if(baseResult.error)throw baseResult.error;if(patchResult.error)throw patchResult.error;
 const product=baseResult.data,patches=patchResult.data||[];
 if(!product||ids.some(id=>!patches.some(p=>p.id===id)))return loadImage(design.thumbnail_url);
 const base=await loadImage(product.view_images?.[view]||product.image_url);
 const side=1400,overlays=[];
 const buffers=new Map(await Promise.all(patches.map(async p=>[p.id,await loadImage(p.image_url)])));
 for(const item of visible){
  const patch=patches.find(p=>p.id===item.patch_id);
  const refW=Number(product.reference_width_cm)>0?Number(product.reference_width_cm):62.5;
  const refH=Number(product.reference_height_cm)>0?Number(product.reference_height_cm):62.5;
  const fitW=Number(product.image_fit_percent)>0?Math.min(100,Number(product.image_fit_percent))/100:1;
  const fitH=Number(product.image_fit_height_percent)>0?Math.min(100,Number(product.image_fit_height_percent))/100:fitW;
  const w=Math.max(1,Math.round(side*Math.min(1,Math.max(.001,Number(patch.width_cm||4)/refW*fitW))));
  const h=Math.max(1,Math.round(side*Math.min(1,Math.max(.001,Number(patch.height_cm||4)/refH*fitH))));
  const rotated=await sharp(buffers.get(patch.id),{limitInputPixels:25000000}).ensureAlpha().resize(w,h,{fit:'fill'}).rotate(Number(item.rotation)||0,{background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer({resolveWithObject:true});
  const left=Math.round(Number(item.x)*side-rotated.info.width/2),top=Math.round(Number(item.y)*side-rotated.info.height/2);
  const cropLeft=Math.max(0,-left),cropTop=Math.max(0,-top),width=Math.min(rotated.info.width-cropLeft,side-Math.max(0,left)),height=Math.min(rotated.info.height-cropTop,side-Math.max(0,top));
  if(width<=0||height<=0)continue;
  const input=await sharp(rotated.data).extract({left:cropLeft,top:cropTop,width,height}).png().toBuffer();
  overlays.push({input,left:Math.max(0,left),top:Math.max(0,top)});
 }
 return sharp(base,{limitInputPixels:25000000}).resize(side,side,{fit:'cover'}).composite(overlays).png().toBuffer();
}
