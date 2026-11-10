import {createLookCover,renderLookDesign} from './storefront-look-cover.js';
import {outlinedText} from './storefront-text.js';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
const MAX_BYTES=5*1024*1024;
export async function safeImageBytes(source) {
  if(typeof source!=='string')throw new Error('Ảnh không hợp lệ.');
  if(/^\/assets\/[\w.-]+$/.test(source))return fs.readFile(path.join(process.cwd(),'public',source));
  let url,origin;try{url=new URL(source);origin=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;}catch{throw new Error('Ảnh phải được tải lên kho ảnh Patchie.');}
  if(url.origin!==origin || !url.pathname.startsWith('/storage/v1/object/public/') || url.username || url.password)throw new Error('Ảnh phải nằm trong kho ảnh công khai của Patchie.');
  const response=await fetch(url,{signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!response.ok)throw new Error('Không tải được ảnh nguồn.');
  if(Number(response.headers.get('content-length'))>MAX_BYTES)throw new Error('Ảnh nguồn tối đa 5 MB.');
  const reader=response.body.getReader();const chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES)throw new Error('Ảnh nguồn tối đa 5 MB.');chunks.push(value);}}finally{await reader.cancel();}
  return Buffer.concat(chunks);
}
function titleLines(s){const lines=[''];for(const word of s.split(/\s+/)){if((lines.at(-1)+' '+word).trim().length>32&&lines.length<2)lines.push(word);else lines[lines.length-1]+=(lines.at(-1)?' ':'')+word;}return lines.map(x=>x.length>48?x.slice(0,45)+'…':x);}
export async function createStorefrontImages(entry,db) {
  let source;
  if(entry.image_mode==='upload'){
    if(!entry.source_image_url)throw new Error('Tải ảnh riêng trước khi lưu.');
    source=await safeImageBytes(entry.source_image_url);
  }else{
    let urls=[],lookDesign=null;
    if(entry.kind==='collection'){
      const ids=entry.patch_items.map(x=>x.patch_id);const {data,error}=await db.from('patches').select('id,image_url').in('id',ids);if(error)throw error;
      urls=ids.slice(0,9).map(id=>data.find(p=>p.id===id)?.image_url);if(urls.some(x=>!x))throw new Error('Có patch thiếu ảnh.');
    }else{
      const {data,error}=await db.from('product_designs').select('thumbnail_url,product_id,placements').eq('id',entry.product_design_id||'').maybeSingle();if(error)throw error;
      if(!data?.thumbnail_url)throw new Error('Chọn mẫu phối có thumbnail hoặc tải ảnh riêng.');urls=[data.thumbnail_url];lookDesign=data;
    }
    if(entry.kind==='look'){
      source=await createLookCover(await renderLookDesign(lookDesign,db,safeImageBytes),entry);
    }else{
    const colors={lavender:['#f7f2ff','#b59bd3','#57406d'],mint:['#f1f8ed','#a2c4a8','#315348'],peach:['#fff3eb','#e8b3a3','#754c50']};const [bg,accent,ink]=colors[entry.tone];
    const lines=titleLines(entry.name);
    const text=await Promise.all([
      outlinedText('patchie',{x:70,y:100,size:34,fill:ink,bold:true}),
      outlinedText(entry.kind==='collection'?'BỘ SƯU TẬP PATCH':'GÓC PHỐI XINH',{x:70,y:158,size:21,fill:ink}),
      ...lines.map((line,i)=>outlinedText(line,{x:70,y:225+i*55,size:line.length>32?34:44,fill:ink,bold:true})),
      outlinedText(entry.kind==='collection'?`${entry.patch_items.reduce((s,x)=>s+x.quantity,0)} patch trong bộ${entry.patch_items.length>9?' · Một số mẫu đại diện':''}`:'Phối chút riêng, mang theo mình',{x:70,y:1130,size:24,fill:ink})
    ]);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect width="1200" height="1200" rx="50" fill="${bg}"/><rect x="26" y="26" width="1148" height="1148" rx="36" fill="none" stroke="${accent}" stroke-width="3" ${entry.template==='stitched'?'stroke-dasharray="12 9"':''}/>${entry.template==='sticker'?`<circle cx="1080" cy="95" r="72" fill="#dcf477"/><path d="M50 1100 Q260 950 420 1200 H0Z" fill="${accent}"/>`:''}${text.join('')}<path d="M210 74 Q213 85 224 88 Q213 91 210 102 Q207 91 196 88 Q207 85 210 74Z" fill="${ink}"/></svg>`;
    const count=urls.length,cols=count===1?1:count<=4?2:3,rows=Math.ceil(count/cols),cellW=1060/cols,cellH=750/rows;
    const composites=[];
    for(let i=0;i<count;i++){
      const bytes=await safeImageBytes(urls[i]);const w=Math.floor(cellW-36),h=Math.floor(cellH-36);
      const image=await sharp(bytes,{limitInputPixels:25000000}).rotate().resize(w,h,{fit:'contain',background:entry.kind==='look'?'#ffffff':{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
      composites.push({input:image,left:Math.round(70+(i%cols)*cellW+18),top:Math.round(310+Math.floor(i/cols)*cellH+18)});
    }
    source=await sharp(Buffer.from(svg)).composite(composites).png().toBuffer();
    }
  }
  const large=await sharp(source,{limitInputPixels:25000000}).rotate().resize(1200,1200,{fit:'contain',background:'#fffdf8'}).webp({quality:84,effort:5}).toBuffer();
  let thumbnail;
  for(const quality of [82,72,62,50,40]){thumbnail=await sharp(large).resize(560,560).webp({quality,effort:6}).toBuffer();if(thumbnail.length<=50*1024)break;}
  if(thumbnail.length>50*1024)thumbnail=await sharp(large).resize(480,480).webp({quality:40,effort:6}).toBuffer();
  return {large,thumbnail};
}
