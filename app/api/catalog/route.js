import { serviceDb, jsonError } from '@/lib/supabase';
import { DEFAULT_POPUP_CAMPAIGNS, normalizePopupCampaigns } from '@/lib/popup-campaigns';

const GIFT_DEFAULTS = {
  enabled: true,
  eyebrow: 'QUÀ NHỎ KHAI TRƯƠNG',
  title: 'Nhân dịp khai trương, tụi mình tặng bạn 1 patch làm quen',
  description: 'Bạn thích patch nào thì chọn heee 💖',
  buttonLabel: 'Nhận patch này',
  patchIds: ['patch-pink', 'patch-black']
};

// The catalog is edited from the admin dashboard, so never serve a stale
// cached response to the storefront after a save.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const starter = {
  products: [{ id:'base-offwhite', sku:'BASE-OFFWHITE', product_type:'shirt', name:'Áo thun oversized', color:'Off-white', hex:'#f5f1e8', image_url:'/assets/blank-tee.webp', view_images:{front:'/assets/blank-tee.webp'}, sizes:['S','M','L','XL'], size_guide:'', price:null }],
  patches: [
    { id:'patch-pink', name:'Mũ xanh lá', image_url:'/assets/patch-pink-cap.webp', width_cm:4, height_cm:4, price:null, quote:'nhỏ xíu mà có võ', patch_group:'Best Seller', patch_groups:['Best Seller'] },
    { id:'patch-black', name:'Mặt nạ xanh', image_url:'/assets/patch-black-green.webp', width_cm:4, height_cm:4, price:null, quote:'bí ẩn một chút mới vui', patch_group:'Limited', patch_groups:['Limited'] },
    { id:'patch-red', name:'Mũ vàng', image_url:'/assets/patch-red-white.webp', width_cm:4, height_cm:4, price:null, quote:'đội mood vui lên áo', patch_group:'Seasonal', patch_groups:['Seasonal'] },
    { id:'patch-yellow', name:'Mũ xanh dương', image_url:'/assets/patch-yellow-blue.webp', width_cm:4, height_cm:4, price:null, quote:'hôm nay hơi đáng yêu', patch_group:'Cute Animal', patch_groups:['Cute Animal'] }
  ],
  settings: { messengerUrl:'', sizes:['S','M','L','XL'], privacyText:'Bản mẫu: shop dùng thông tin này để xử lý yêu cầu thiết kế và xóa sau 30 ngày.', brand:{}, giftOffer:GIFT_DEFAULTS, popupCampaigns:DEFAULT_POPUP_CAMPAIGNS, activePopupCampaign:'traditional-gift', defaultPatchGroup:'all' }
};

export async function GET() {
  try {
    const db = serviceDb();
    const [{data:products,error:pErr},{data:patches,error:paErr},{data:settings,error:sErr}] = await Promise.all([
      db.from('products').select('*').eq('active',true).order('created_at'),
      db.from('patches').select('*').eq('active',true).order('patch_group').order('sort_order'),
      db.from('settings').select('key,value')
    ]);
    if (pErr || paErr || sErr) throw new Error('Database chưa được khởi tạo. Chạy supabase/schema.sql trước.');
    const config = Object.fromEntries((settings||[]).map(x=>[x.key,x.value]));
    const popupCampaigns = normalizePopupCampaigns(config.popupCampaigns, config.giftOffer || GIFT_DEFAULTS);
    return Response.json(
      {
        products:products||[],
        patches:patches||[],
        settings:{
          messengerUrl:config.messengerUrl||'',
          sizes:config.sizes||['S','M','L','XL'],
          privacyText:config.privacyText||'',
          giftOffer:{...GIFT_DEFAULTS,...(config.giftOffer||{})},
          popupCampaigns,
          activePopupCampaign:typeof config.activePopupCampaign==='string'&&config.activePopupCampaign
            ? config.activePopupCampaign
            : popupCampaigns.find(campaign=>campaign.enabled)?.id || popupCampaigns[0]?.id || '',
          defaultPatchGroup:typeof config.defaultPatchGroup==='string'&&config.defaultPatchGroup?config.defaultPatchGroup:'all',
          // Brand & content is stored in the existing settings table as JSON.
          // It must be forwarded here or the storefront can only show defaults.
          brand:config.brand||{}
        }
      },
      {headers:{'Cache-Control':'no-store, max-age=0'}}
    );
  } catch (e) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return Response.json(starter);
    return jsonError(e.message||'Không tải được danh mục.',503);
  }
}
