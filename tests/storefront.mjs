import assert from 'node:assert/strict';
import {validateEntry,packCollection,shopeeUrl,buyLabel} from '../lib/storefront.js';
import {createStorefrontImages,safeImageBytes} from '../lib/storefront-images.js';
import sharp from 'sharp';
const entry={kind:'collection',name:'Bộ patch K-pop',description:'',group_ids:[],patch_items:[{patch_id:'a',quantity:2}],shopee_url:'https://shopee.vn/product/1/2',sale_type:'patch_set',template:'stitched',tone:'lavender',image_mode:'auto'};
assert.equal(validateEntry(entry).active,false);
assert.throws(()=>validateEntry({...entry,patch_items:[{patch_id:'a',quantity:0}]}));
assert.throws(()=>validateEntry({...entry,group_ids:'bad'}));
assert.throws(()=>validateEntry({...entry,shopee_url:'https://shopee.vn.evil.test/a'}));
assert.equal(shopeeUrl('javascript:alert(1)'),'');
assert.equal(shopeeUrl('https://user:pass@shopee.vn/a'),'');
assert.equal(buyLabel({kind:'look',sale_type:'base'}),'Mua phôi trên Shopee');
const patches=[{id:'a',width_cm:4,height_cm:4},{id:'big',width_cm:50,height_cm:50}];
const packed=packCollection([{patch_id:'a',quantity:8},{patch_id:'big',quantity:1}],patches,{reference_width_cm:10,reference_height_cm:10});
assert.equal(packed.placements.length+packed.remaining.length,9);assert.ok(packed.remaining.includes('big'));
assert.ok(packed.placements.every(p=>p.x>=.32&&p.x<=.68&&p.y>=.32&&p.y<=.68));
process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.supabase.co';
await assert.rejects(()=>safeImageBytes('http://127.0.0.1/private'));
const db={from:()=>({select:()=>({in:async()=>({data:[{id:'a',image_url:'/assets/patch-pink-cap.webp'}]})})})};
for(const template of ['stitched','sticker','minimal']){
 const image=await createStorefrontImages({...entry,template},db);
 const meta=await sharp(image.large).metadata();assert.equal(meta.width,1200);assert.equal(meta.height,1200);
 assert.ok(image.thumbnail.length<=51200);console.log(template,'thumbnail',image.thumbnail.length,'bytes');
}
console.log('Storefront validation, packing, image bounds and SSRF checks passed.');
