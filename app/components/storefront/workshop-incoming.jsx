'use client';
import {useEffect,useState} from 'react';
import './workshop-incoming.css';
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
 const isCollection=data?.item.kind==='collection';
 const chosen=isCollection?product:catalog.products.find(p=>p.id===data?.design?.product_id);
 const thumb=p=>p?.thumbnail_url||p?.view_images?.front||p?.image_url;
 return <section className="wi-panel" aria-label="Chọn phôi cho mẫu đã chọn">
  <header className="wi-header"><div><span className="wi-eyebrow">MANG GU CỦA BẠN VÀO WORKSHOP</span><h2>{data?.item.name||'Đang mở mẫu bạn chọn…'}</h2></div><button type="button" className="wi-close" onClick={close} aria-label="Đóng lựa chọn mẫu">×</button></header>
  {error&&<p className="wi-warning" role="alert">{error}</p>}
  {data&&<div className="wi-body"><div className="wi-selection">
  {isCollection?<><h3>Chọn một chiếc phôi bạn thích</h3><p className="wi-help">Chạm vào ảnh để chọn kiểu và màu.</p><div className="wi-options" aria-label="Các mẫu phôi">{catalog.products.map(p=><button type="button" key={p.id} className="wi-option" aria-pressed={base===p.id} onClick={()=>setBase(p.id)}><span className="wi-photo">{thumb(p)?<img src={thumb(p)} alt={`${p.name}${p.color?' · '+p.color:''}`} width="240" height="240" loading="lazy"/>:<span>Ảnh đang cập nhật</span>}{base===p.id&&<span className="wi-check" aria-hidden="true">✓</span>}</span><strong>{p.name}</strong><span className="wi-color">{p.hex&&<i style={{backgroundColor:p.hex}}/>}{p.color||'Màu mặc định'}</span></button>)}</div></>:<><h3>Mẫu phối bạn đã chọn</h3>{data.item.thumbnail_url&&<img className="wi-design" src={data.item.thumbnail_url} alt={data.item.name} width="360" height="360"/>}</>}
  </div><aside className="wi-summary">{chosen&&<><span className="wi-eyebrow">{isCollection?'PHÔI ĐANG CHỌN':'PHÔI CỦA MẪU'}</span><div className="wi-chosen">{thumb(chosen)&&<img src={thumb(chosen)} alt="" width="88" height="88"/>}<div><strong>{chosen.name}</strong><span>{chosen.color}</span></div></div></>}
  {isCollection&&<p className="wi-count"><b>{Math.min(12,packed.placements.length)}/{total}</b> patch có thể thêm vào phôi này</p>}
  {isCollection&&remaining>0&&<p className="wi-warning" role="status">{remaining} patch chưa thêm được vì kích thước, tình trạng khả dụng hoặc giới hạn 12 patch. Bạn có thể thử phôi khác.</p>}
  <button type="button" className="wi-apply" disabled={!design?.placements?.length} onClick={()=>{if(apply(design))close();}}>{isCollection?'Thử phối trên phôi này':'Custom mẫu này'} <span aria-hidden="true">→</span></button>
  <p className="wi-help">Bạn có thể kéo, xoay và chỉnh lại patch ở bước tiếp theo.</p><button type="button" className="wi-later" onClick={close}>Để sau nhé</button></aside></div>}
 </section>;
}
