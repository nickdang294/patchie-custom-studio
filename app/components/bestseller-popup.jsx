 'use client';
import {useEffect,useRef,useState} from 'react';
import './bestseller-popup.css';
const shopeeUrl = value => {try { const url=new URL(value); return url.protocol==='https:' && /(^|\.)(shopee\.vn|shopee\.com|shp\.ee)$/.test(url.hostname) ? url.href : ''; } catch {return '';} };
export default function BestsellerPopup({onCustom,onClose}) {
  const dialog=useRef(null),[data,setData]=useState(null),[error,setError]=useState('');
  useEffect(()=>{
    const abort=new AbortController();
    fetch('/api/bestsellers',{signal:abort.signal,cache:'no-store'}).then(r=>r.ok?r.json():null).then(result=>{
      if (!abort.signal.aborted && result?.items?.length) setData(result);
    }).catch(()=>{});
    return ()=>abort.abort();
  },[]);
  useEffect(()=>{
    if (!data || !dialog.current) return;
    const previous=document.activeElement;
    dialog.current.showModal();
    try {sessionStorage.setItem('patchie-bestsellers-'+new Date().toISOString().slice(0,7),'seen');}catch{}
    const scroll=document.documentElement.style.overflow;
    document.documentElement.style.overflow='hidden';
    return ()=>{document.documentElement.style.overflow=scroll;previous?.focus?.({preventScroll:true});};
  },[data]);
  if (!data) return null;
  return <dialog ref={dialog} className="bestseller-dialog" aria-labelledby="bestseller-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="bestseller-content">
      <button type="button" className="bestseller-close" aria-label="Đóng best-seller" onClick={onClose}>×</button>
      <header><span className="bestseller-eyebrow">PATCHIE'S LITTLE FAVORITES ✦</span><h2 id="bestseller-title">{data.title}</h2></header>
      <div className="bestseller-grid">{data.items.map(design=><article className="bestseller-card" key={design.id}>
        <div className="bestseller-image"><img src={design.thumbnail_url} width="420" height="420" alt={design.name} decoding="async" fetchPriority="low"/></div>
        <h3>{design.name}</h3><button type="button" className="bestseller-custom" onClick={()=>{if(onCustom(design)===false)setError('Mẫu vừa thay đổi. Bạn tải lại trang để cập nhật nha.');}}>✦ Custom mẫu này</button>
        {shopeeUrl(design.shopee_url)?<a className="bestseller-shop" href={shopeeUrl(design.shopee_url)} target="_blank" rel="noopener noreferrer">Mua ngay trên Shopee ↗</a>:<span className="bestseller-shop is-unavailable">Shopee sắp có nha</span>}
      </article>)}</div>
      {error&&<p role="status">{error}</p>}<button type="button" className="bestseller-skip" onClick={onClose}>Tự phối theo gu của tui →</button>
    </div>
  </dialog>;
}
