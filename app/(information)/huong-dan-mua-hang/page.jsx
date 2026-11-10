import BuyingGuide from '../../components/buying-guide';
import {serviceDb} from '@/lib/supabase';
import './seller-disclosure.css';
export const metadata={title:'Hướng dẫn mua hàng & chính sách | Patchie'};
export const dynamic='force-dynamic';
export default async function Page(){let info={};try{const {data}=await serviceDb().from('settings').select('value').eq('key','legalBusiness').maybeSingle();info=data?.value||{};}catch{}return <><BuyingGuide/><section className="seller-disclosure"><p className="seller-kicker">THÔNG TIN NGƯỜI BÁN</p><h2>Patchie được vận hành bởi</h2><dl>{[['Chủ thể kinh doanh',info.seller_type],['Người bán',info.seller_name],['Mã số thuế',info.tax_id],['Địa chỉ',info.business_address],['Điện thoại',info.phone],['Email',info.email]].map(([k,v])=>v&&<div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><p className="seller-origin">Sản phẩm sử dụng chất liệu vải canvas hoặc polyester tùy mẫu; xuất xứ Trung Quốc.</p></section></>}
