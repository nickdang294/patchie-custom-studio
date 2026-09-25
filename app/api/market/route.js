import { serviceDb, jsonError } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MARKET_DEFAULTS={
  brand:'Patch Market',
  eyebrow:'PATCHIE MARKET',
  title:'Những miếng patch bạn thích, mua riêng cũng được.',
  subtitle:'Chọn patch lẻ, gom vào giỏ và gửi mã đơn cho shop qua Messenger.',
  bannerImageUrl:'',
  bannerLink:'',
  bannerBadge:'NEW DROP'
};

const starterPatches=[
  {id:'patch-pink',name:'Mũ xanh lá',image_url:'/assets/patch-pink-cap.webp',width_cm:4,height_cm:4,price:null,patch_group:'Best Seller',patch_groups:['Best Seller'],stock_quantity:20,sold_count:0,is_featured:true,is_new:false,active:true},
  {id:'patch-black',name:'Mặt nạ xanh',image_url:'/assets/patch-black-green.webp',width_cm:4,height_cm:4,price:null,patch_group:'Limited',patch_groups:['Limited'],stock_quantity:20,sold_count:0,is_featured:false,is_new:true,active:true},
  {id:'patch-red',name:'Mũ vàng',image_url:'/assets/patch-red-white.webp',width_cm:4,height_cm:4,price:null,patch_group:'Seasonal',patch_groups:['Seasonal'],stock_quantity:20,sold_count:0,is_featured:false,is_new:false,active:true},
  {id:'patch-yellow',name:'Mũ xanh dương',image_url:'/assets/patch-yellow-blue.webp',width_cm:4,height_cm:4,price:null,patch_group:'Cute Animal',patch_groups:['Cute Animal'],stock_quantity:20,sold_count:0,is_featured:false,is_new:false,active:true}
];

export async function GET(){
  try{
    const db=serviceDb();
    const [{data:patches,error:pErr},{data:settings,error:sErr}]=await Promise.all([
      db.from('patches').select('*').eq('active',true).order('is_featured',{ascending:false}).order('is_new',{ascending:false}).order('sort_order'),
      db.from('settings').select('key,value').in('key',['market','messengerUrl'])
    ]);
    if(pErr||sErr)throw new Error('Chưa tải được Patch Market.');
    const config=Object.fromEntries((settings||[]).map(x=>[x.key,x.value]));
    return Response.json({patches:patches||[],market:{...MARKET_DEFAULTS,...(config.market||{})},messengerUrl:config.messengerUrl||''},{headers:{'Cache-Control':'no-store, max-age=0'}});
  }catch(e){
    if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return Response.json({patches:starterPatches,market:MARKET_DEFAULTS,messengerUrl:''});
    return jsonError(e.message||'Không tải được Patch Market.',503);
  }
}
