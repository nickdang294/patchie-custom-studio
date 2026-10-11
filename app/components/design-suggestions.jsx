'use client';
export default function DesignSuggestions({mobile=false,enabled,onToggle,loading,error,designs,onPreview,onRetry}){
  return <section className={`product-design-suggestions ${mobile?'mobile-product-design-suggestions':''}`}>
    <div className="product-design-suggestions-head"><div><b>Mẫu phối hợp gu</b></div><button type="button" role="switch" className={`product-design-switch ${enabled?'is-on':'is-off'}`} aria-checked={enabled} aria-label="Bật hoặc tắt gợi ý mẫu phối" onClick={()=>onToggle(!enabled)}><span/></button></div>
    {enabled&&<div className="design-result-slot" aria-busy={loading}>
      {designs.length>0?<div className="product-design-strip">{designs.map(design=><button type="button" key={design.id} className="product-design-card" disabled={loading} onClick={()=>onPreview(design)}><span className="product-design-image"><img src={design.thumbnail_url} alt="" loading="lazy" decoding="async"/></span><b>{design.name}</b><small>{design.match_count}/{design.total_patches} patch trùng</small></button>)}</div>:loading?<div className="design-skeleton" aria-hidden="true"><i/><i/></div>:!error?<p className="admin-help product-design-empty">Chưa có mẫu phù hợp với những patch bạn đã chọn.</p>:null}
      {loading&&<div className="suggestion-status-overlay" role="status"><span className="computing-spark">✦</span><b>Patchie đang phối...</b></div>}
      {error&&!loading&&<div className="suggestion-error" role="status"><span>{error}</span><button type="button" onClick={onRetry}>Thử lại</button></div>}
    </div>}
    {!enabled&&error&&!loading&&<button type="button" className="suggestion-inline-retry" onClick={onRetry}>Chưa tải được gợi ý · Thử lại</button>}
  </section>;
}
