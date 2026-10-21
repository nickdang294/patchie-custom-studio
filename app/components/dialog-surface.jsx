'use client';

import './studio-dialogs.css';
const validShopeeUrl = value => {
  try {
    const url = new URL(String(value || ''));
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && (host === 'shopee.vn' || host.endsWith('.shopee.vn') || host === 'shopee.com' || host.endsWith('.shopee.com') || host === 'shp.ee' || host.endsWith('.shp.ee')) ? url.href : '';
  } catch {
    return '';
  }
};
const design = ({
  setSelectedProductDesign,
  selectedProductDesign,
  designPreviewLoading,
  product,
  designPreviewView,
  catalog,
  patchSizePercent,
  activeViews,
  setDesignPreviewView,
  applyProductDesign
}) => <div className="design-preview-overlay" role="dialog" aria-modal="true" aria-labelledby="design-preview-title" onClick={e => {
  if (e.target === e.currentTarget) setSelectedProductDesign(null);
}}><section className="design-preview-modal">
      <header className="design-preview-header"><div><span className="design-preview-eyebrow">✦ PATCHIE PICK</span><h2 id="design-preview-title">{selectedProductDesign.name}</h2></div><button className="design-preview-close" type="button" onClick={() => setSelectedProductDesign(null)} aria-label="Đóng cửa sổ">×</button></header>
      {designPreviewLoading ? <div className="design-preview-loading"><span className="computing-spark">✦</span><b>Patchie đang phối mẫu…</b><i><em /></i></div> : <div className="design-preview-stage"><img className="design-preview-base" src={product?.view_images?.[designPreviewView] || product?.image_url} alt={`${product?.name || 'Sản phẩm'} – ${designPreviewView === 'back' ? 'mặt sau' : 'mặt trước'}`} />{selectedProductDesign.placements.filter(item => item.view === designPreviewView).map((item, i) => {
        const patch = catalog.patches.find(p => p.id === item.patch_id);
        return patch ? <img key={`${item.patch_id}-${i}`} src={patch.image_url} alt={patch.name} className="design-preview-patch" style={{
          left: `${Number(item.x) * 100}%`,
          top: `${Number(item.y) * 100}%`,
          ...Object.fromEntries(Object.entries(patchSizePercent(patch, designPreviewView)).map(([key, value]) => [key, `${value}%`])),
          transform: `translate(-50%,-50%) rotate(${Number(item.rotation) || 0}deg)`
        }} /> : null;
      })}
        <nav className="design-preview-views" aria-label="Chọn mặt sản phẩm">{activeViews.filter(v => v.id === 'front' || v.id === 'back' || selectedProductDesign.placements.some(item => item.view === v.id)).map(v => <button key={v.id} type="button" className={designPreviewView === v.id ? 'is-active' : ''} aria-pressed={designPreviewView === v.id} onClick={() => setDesignPreviewView(v.id)}>{v.id === 'front' ? 'Trước' : v.id === 'back' ? 'Sau' : v.short}</button>)}</nav>
      </div>}
      <footer className="design-preview-actions"><button type="button" className="design-preview-custom" disabled={designPreviewLoading} onClick={() => applyProductDesign(selectedProductDesign)}><span aria-hidden="true">✦</span> Custom mẫu này</button>{validShopeeUrl(selectedProductDesign.shopee_url) ? <a className="design-preview-shopee" href={validShopeeUrl(selectedProductDesign.shopee_url)} target="_blank" rel="noreferrer"><span aria-hidden="true">♡</span> Mua liền trên Shopee của Patchie <span aria-hidden="true">↗</span></a> : <button type="button" className="design-preview-shopee is-unavailable" disabled title="Thêm link Shopee cho sản phẩm này trong Admin → Mẫu phối sẵn"><span aria-hidden="true">♡</span> Mua liền trên Shopee của Patchie</button>}</footer>
      {!validShopeeUrl(selectedProductDesign.shopee_url) && <p className="design-preview-hint">Shop chưa cài link Shopee cho mẫu phối này.</p>}
    </section></div>;
const order = ({
  setMessengerPrompt,
  order,
  copyOrderMessage,
  sendOrderToMessenger,
  copied
}) => <div className="cute-modal order-review-modal" role="dialog" aria-modal="true" aria-label="Kiểm tra nội dung đơn"><div className="cute-card order-review-card"><button type="button" className="order-review-close" aria-label="Đóng" onClick={() => setMessengerPrompt(false)}>×</button><span className="cute-spark order-review-spark">✦</span><small className="order-review-kicker">MÃ ĐƠN {order.id}</small><h3>Kiểm tra đơn trước khi gửi nha</h3><p className="order-review-intro">Xem lại nội dung bên dưới. Bạn có thể copy hoặc gửi thẳng cho shop qua Messenger.</p><pre className="order-message-preview">{order.message}</pre><div className="order-review-actions"><button type="button" className="order-review-copy" onClick={() => copyOrderMessage()}>Copy nội dung</button><button type="button" className="order-review-messenger" onClick={sendOrderToMessenger}>Gửi Messenger ↗</button></div>{copied && <div className="order-review-copied">✦ Đã copy rồi, dán vào Messenger là xong!</div>}</div></div>;
const smartPosition = ({
  chooseSmartPosition
}) => <div className="cute-modal smart-position-modal" role="dialog" aria-modal="true" aria-label="Gợi ý vị trí thông minh"><div className="cute-card smart-position-card"><span className="cute-spark">✦</span><h3>Bật gợi ý vị trí thông minh?</h3><p>Patchie sẽ hiện line căn chỉnh và hút nhẹ patch vào những vị trí được gợi ý. Bạn có thể đổi lại bằng icon bóng đèn trên mockup bất cứ lúc nào.</p><div><button type="button" className="cute-secondary" onClick={() => chooseSmartPosition(false)}>Tắt gợi ý</button><button type="button" className="cute-primary" onClick={() => chooseSmartPosition(true)}>Bật gợi ý</button></div></div></div>;
const undo = ({
  setUndoAsk,
  approveUndo
}) => <div className="cute-modal" role="dialog" aria-modal="true" aria-label="Xác nhận hoàn tác"><div className="cute-card"><span className="cute-spark">↺</span><h3>Bạn có muốn hoàn tác?</h3><p>Bước vừa rồi sẽ được lùi lại. Hỏi một lần thôi, lần sau bấm là hoàn tác liền.</p><div><button type="button" className="cute-secondary" onClick={() => setUndoAsk(false)}>Giữ lại</button><button type="button" className="cute-primary" onClick={approveUndo}>Hoàn tác</button></div></div></div>;
const select = ({
  selectData,
  setSelectSheet,
  catalog
}) => <div className="cute-modal select-modal" role="dialog" aria-modal="true" aria-label={`Chọn ${selectData.label}`} onClick={() => setSelectSheet(null)}><div className={`cute-card select-card ${selectData.label === 'Nhóm patch' && catalog.settings.patchGroupHighlightEnabled !== false ? 'patch-group-spotlight-on' : ''}`} onClick={e => e.stopPropagation()}><span className="cute-spark">⌄</span><h3>{selectData.label}</h3><p>{selectData.intro || 'Chọn một lựa chọn bên dưới nhé.'}</p>{selectData.backSheet && <button type="button" className="select-back" onClick={() => setSelectSheet(selectData.backSheet)}>← Đổi nhóm sản phẩm</button>}<div className="select-options">{selectData.options.map(o => <button type="button" key={o.value} className={`${o.value === selectData.value ? 'selected' : ''} ${o.groupRank ? 'group-featured-' + o.groupRank : ''}`} onClick={() => {
        selectData.onChange(o.value);
        setSelectSheet(selectData.nextSheet || null);
      }}>{o.image && <span className="select-option-thumb"><img src={o.image} alt="" /></span>}<span><b>{o.label}</b>{o.sub && <small>{o.sub}</small>}{o.comingSoon && <em className="coming-soon-mini-tag">COMING SOON</em>}{o.groupRank && <em className="group-featured-mark">Nổi bật {o.groupRank}</em>}</span>{o.price && <strong className="select-price">{o.price}</strong>}<i>{o.value === selectData.value ? '✓' : ''}</i></button>)}</div>{!selectData.options.length && <p className="empty-select">Nhóm này chưa có sản phẩm.</p>}<button type="button" className="cute-secondary select-close" onClick={() => setSelectSheet(null)}>Đóng</button></div></div>;
const dialogs = {
  design,
  order,
  smartPosition,
  undo,
  select
};
export default function DialogSurface({
  kind,
  ...props
}) {
  const Dialog = dialogs[kind];
  return Dialog ? <Dialog {...props} /> : null;
}
