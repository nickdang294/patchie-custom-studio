'use client';
import {useEffect,useRef} from 'react';

function DesignCards({designs,loading,onPreview}){
  const strip=useRef(null);
  useEffect(()=>{
    const images=[...strip.current.querySelectorAll('img[data-thumbnail-src]')];
    const load=img=>{if(img.getAttribute('src')!==img.dataset.thumbnailSrc)img.src=img.dataset.thumbnailSrc;};
    // The viewport and scroll-container clipping both apply. Hidden desktop
    // cards and thumbnails beyond the horizontal strip get no image URL yet.
    if(!('IntersectionObserver' in window)){images.forEach(load);return;}
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){load(entry.target);observer.unobserve(entry.target);}});
    },{rootMargin:'0px',threshold:0.01});
    images.forEach(img=>observer.observe(img));
    return()=>observer.disconnect();
  },[designs]);
  return <div ref={strip} className="product-design-strip">{designs.map(design=><button type="button" key={design.id} className="product-design-card" disabled={loading} onClick={()=>onPreview(design)}><span className="product-design-image"><img key={design.thumbnail_url} data-thumbnail-src={design.thumbnail_url} alt="" loading="lazy" decoding="async" fetchPriority="low"/></span><b className="design-card-name" title={design.name}><span>{design.name}</span></b></button>)}</div>;
}

export default function DesignSuggestions({mobile=false,enabled,onToggle,loading,error,designs,onPreview,onRefresh,canRefresh}){
  const status=loading?'Đang tìm mẫu phối…':error?'Chưa tải được mẫu phối. Bấm thử lại nhé.':designs.length?'Đã tải gợi ý mẫu phối.':'Chưa có mẫu phối sẵn.';
  return <section className={`product-design-suggestions ${mobile?'mobile-product-design-suggestions':''}`}>
    <div className="product-design-suggestions-head"><div><b>Mẫu phối hợp gu</b></div><button type="button" role="switch" className={`product-design-switch ${enabled?'is-on':'is-off'}`} aria-checked={enabled} aria-label="Bật hoặc tắt gợi ý mẫu phối" onClick={()=>onToggle(!enabled)}><span/></button></div>
    <p className="design-suggestion-announcement" role="status">{status}</p>
    <div className="design-result-slot" aria-busy={loading} hidden={!enabled}>
      {designs.length>0?<DesignCards designs={designs} loading={loading} onPreview={onPreview}/>:loading?<div className="design-skeleton" aria-hidden="true"><i/><i/></div>:!error?<p className="admin-help product-design-empty">Chưa có mẫu phối sẵn.</p>:null}
      {loading&&<div className="suggestion-status-overlay" aria-hidden="true"><b>Patchie đang tìm mẫu phối…</b></div>}
      {error&&!loading&&<div className="suggestion-error"><span>{error}</span><button type="button" onClick={onRefresh}>Thử lại</button></div>}
    </div>
    <button type="button" className="mobile-more-suggestions product-design-refresh" disabled={!canRefresh} onClick={onRefresh}>{loading?'Đang tìm mẫu phối…':error?'Thử lại gợi ý mẫu phối':'✦ Gợi ý thêm mẫu phối'}</button>
  </section>;
}
