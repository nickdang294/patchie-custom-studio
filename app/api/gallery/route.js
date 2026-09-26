import { serviceDb } from '@/lib/supabase';

const DEFAULT_GALLERY={
  enabled:true,
  eyebrow:'PATCHIE LOOKBOOK',
  title:'Những chiếc áo đã tìm được mood của mình.',
  subtitle:'Một vài thiết kế đã được dán patch sẵn — chọn look bạn thích rồi gửi mã cho shop.',
  slides:[
    {id:'slide-1',eyebrow:'READY TO WEAR',title:'Mặc mood này đi chơi nha.',body:'Các mẫu đã phối patch sẵn, chụp thật và sẵn sàng về với bạn.',image_url:'/assets/blank-tee.webp',ctaLabel:'Xem các look',ctaHref:'#looks'},
    {id:'slide-2',eyebrow:'A LITTLE DETAIL',title:'Một miếng nhỏ, cả outfit khác đi.',body:'Từ áo tee đến túi tote, mỗi look là một câu chuyện riêng.',image_url:'/assets/blank-tee.webp',ctaLabel:'Khám phá collection',ctaHref:'#looks'}
  ],
  looks:[
    {id:'look-1',name:'Off-white · Little Mood',category:'Áo Tee',price:249000,image_url:'/assets/blank-tee.webp',detail_image_url:'/assets/blank-tee.webp',description:'Áo tee off-white với patch nhỏ ở ngực.',tag:'EDITOR PICK',href:'/'},
    {id:'look-2',name:'Soft blue · Weekend',category:'Áo Tee',price:249000,image_url:'/assets/blank-tee.webp',detail_image_url:'/assets/blank-tee.webp',description:'Một chiếc tee cho những ngày muốn nhẹ nhàng.',tag:'NEW LOOK',href:'/'},
    {id:'look-3',name:'Tote · Tiny story',category:'Túi Tote',price:189000,image_url:'/assets/blank-tee.webp',detail_image_url:'/assets/blank-tee.webp',description:'Túi tote có patch dán sẵn, đem đi đâu cũng vui.',tag:'COMMUNITY FAV',href:'/'}
  ],
  community:[
    {id:'community-1',image_url:'/assets/blank-tee.webp',quote:'Dán lên một cái là chiếc áo cũ thành mood mới luôn.',name:'Linh',meta:'Khách Patchie · TP.HCM'},
    {id:'community-2',image_url:'/assets/blank-tee.webp',quote:'Mình thích nhất là nhìn ngoài đời patch vẫn xinh như trên web.',name:'An',meta:'Khách Patchie · Hà Nội'},
    {id:'community-3',image_url:'/assets/blank-tee.webp',quote:'Nhỏ thôi nhưng ai cũng hỏi mua ở đâu.',name:'Vy',meta:'Khách Patchie · Đà Nẵng'}
  ]
};

export const dynamic='force-dynamic';
export const revalidate=0;

export async function GET(){
  try{
    const db=serviceDb();
    const [{data:settings,error:sErr}]=await Promise.all([db.from('settings').select('key,value')]);
    if(sErr)throw sErr;
    const config=Object.fromEntries((settings||[]).map(row=>[row.key,row.value]));
    return Response.json({brand:config.brand||{},gallery:{...DEFAULT_GALLERY,...(config.gallery||{})}},{headers:{'Cache-Control':'no-store, max-age=0'}});
  }catch(error){
    return Response.json({brand:{},gallery:DEFAULT_GALLERY},{headers:{'Cache-Control':'no-store, max-age=0'}});
  }
}

export { DEFAULT_GALLERY };
