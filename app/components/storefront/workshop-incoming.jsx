'use client';
import {useEffect,useState} from 'react';
import {packCollection} from '@/lib/storefront';
export default function WorkshopIncoming({catalog,productId,apply,onClose,eligible}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[base,setBase]=useState(productId),[open,setOpen]=useState(false);
 useEffect(()=>{let abort=new AbortController();try{const raw=sessionStorage.getItem('patchie-workshop-incoming');if(!raw)return;const {id}=JSON.parse(raw);setOpen(true);fetch('/api/storefront?id='+encodeURIComponent(id),{signal:abort.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Không tải được mẫu.');setData(d);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);});}catch{setError('Không đọc được mẫu đã chọn.');}return()=>abort.abort();},[]);
 function close(){sessionStorage.removeItem('patchie-workshop-incoming');setOpen(false);onClose();}
 if(!open)return null;
 const product=catalog.products.find(p=>p.id===base),items=data?.item.patch_items||[];
 const available=catalog.patches.filter(p=>eligible(p,product));
 const packed=product?packCollection(items.map(x=>({...x,quantity:Math.min(x.quantity,Math.max(0,Number(available.find(p=>p.id===x.patch_id)?.stock_quantity??0)))})),available,product):{placements:[],remaining:[]};
 const total=items.reduce((n,p)=>n+p.quantity,0),remaining=total-Math.min(12,packed.placements.length);
 const design=data?.item.kind==='look'?data.design:{product_id:base,placements:packed.placements.slice(0,12)};
 return <section className="panel" style={{margin:'16px 0',padding:24,border:'2px solid #aa8ad1'}} aria-label="Mẫu đã chọn"><button type="button" onClick={close} style={{float:'right'}}>Để sau ×</button><h2>{data?.item.name||'Đang mở mẫu bạn chọn…'}</h2>{error&&<p role="alert">{error}</p>}{data?.item.kind==='collection'&&<><label>Chọn phôi để thử bộ patch <select value={base} onChange={e=>setBase(e.target.value)}>{catalog.products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><p>Giữ nguyên kích thước thật của patch. Đây là bố cục khởi đầu để bạn tự chỉnh.</p>{remaining>0&&<p role="status">{remaining} patch chưa đặt được do kích thước, tình trạng khả dụng hoặc giới hạn 12 patch. Bạn có thể đổi phôi; chỉ {Math.min(12,packed.placements.length)} patch sẽ được thêm.</p>}</>}{data&&<button className="button coral" disabled={!design?.placements?.length} onClick={()=>{if(apply(design))close();}}>Áp dụng vào Workshop</button>}<p>Custom xong, lấy mã đơn và gửi cho shop qua kênh riêng như trước nhé.</p></section>;
}
