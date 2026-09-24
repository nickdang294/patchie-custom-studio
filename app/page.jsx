'use client';

import { useEffect, useRef, useState } from 'react';

const STARTER=[
  {id:'patch-pink',name:'Mũ xanh lá',image_url:'/assets/patch-pink-cap.webp',width_cm:4,height_cm:4},
  {id:'patch-black',name:'Mặt nạ xanh',image_url:'/assets/patch-black-green.webp',width_cm:4,height_cm:4},
  {id:'patch-red',name:'Mũ vàng',image_url:'/assets/patch-red-white.webp',width_cm:4,height_cm:4},
  {id:'patch-yellow',name:'Mũ xanh dương',image_url:'/assets/patch-yellow-blue.webp',width_cm:4,height_cm:4}
];

const VIEWS=[
  {id:'front',label:'Mặt trước',short:'Trước'},
  {id:'left_sleeve',label:'Tay áo trái',short:'Tay trái'},
  {id:'right_sleeve',label:'Tay áo phải',short:'Tay phải'},
  {id:'back',label:'Lưng áo',short:'Lưng'}
];

const TEE_REFERENCE_WIDTH_CM=62.5;
const TEE_REFERENCE_HEIGHT_CM=62.5;
const clampPatchPercent=value=>Math.max(.8,Math.min(35,value));
const defaultProduct={id:'base-offwhite',sku:'BASE-OFFWHITE',name:'Áo thun oversized',color:'Off-white',hex:'#f5f1e8',image_url:'/assets/blank-tee.webp',view_images:{front:'/assets/blank-tee.webp'},sizes:['S','M','L','XL']};

export default function Home(){
  const [catalog,setCatalog]=useState({products:[defaultProduct],patches:STARTER,settings:{sizes:['S','M','L','XL'],messengerUrl:'',privacyText:'Shop dùng thông tin này để xử lý yêu cầu thiết kế.'}});
  const [chosen,setChosen]=useState(STARTER[0].id),[placed,setPlaced]=useState([]),[history,setHistory]=useState([]),[activeView,setActiveView]=useState('front'),[mode,setMode]=useState('shop'),[productId,setProductId]=useState(defaultProduct.id),[size,setSize]=useState(''),[name,setName]=useState(''),[note,setNote]=useState(''),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[toast,setToast]=useState(''),[order,setOrder]=useState(null);
  const stage=useRef(null),drag=useRef(null);
  const product=catalog.products.find(x=>x.id===productId)||catalog.products[0]||defaultProduct;
  const sizes=product?.sizes?.length?product.sizes:catalog.settings.sizes||[];
  const chosenPatch=catalog.patches.find(x=>x.id===chosen);
  const viewImages=product?.view_images||{};
  const activeImage=viewImages[activeView]||viewImages.front||product?.image_url||defaultProduct.image_url;
  const activePlaced=placed.filter(x=>(x.view||'front')===activeView);
  const show=s=>{setToast(s);setTimeout(()=>setToast(''),2600)};
  const patchPreviewStyle=p=>({width:`${clampPatchPercent((Number(p?.width_cm||4)/TEE_REFERENCE_WIDTH_CM)*100)}%`,height:`${clampPatchPercent((Number(p?.height_cm||4)/TEE_REFERENCE_HEIGHT_CM)*100)}%`,maxWidth:'none',maxHeight:'none'});
  const patchLabel=p=>`${Number(p?.width_cm||4).toFixed(1).replace('.0','')} × ${Number(p?.height_cm||4).toFixed(1).replace('.0','')} cm`;
  const viewName=id=>VIEWS.find(v=>v.id===id)?.label||'Mặt trước';

  useEffect(()=>{fetch('/api/catalog').then(r=>r.json()).then(d=>{if(d.products?.length&&d.patches?.length){setCatalog(d);setProductId(d.products[0].id);setChosen(d.patches[0].id);}}).catch(()=>{});},[]);

  function remember(){setHistory(a=>[...a.slice(-19),placed.map(x=>({...x}))]);setOrder(null);}
  function undo(){setHistory(a=>{const prev=a[a.length-1];if(!prev){show('Chưa có bước để hoàn tác.');return a;}setPlaced(prev.map(x=>({...x})));setOrder(null);return a.slice(0,-1);});}
  function add(){if(!chosenPatch)return show('Chọn một patch trước nhé.');if(placed.length>=12)return show('Bố cục tối đa 12 patch.');remember();setPlaced(a=>[...a,{uid:crypto.randomUUID(),patchId:chosen,view:activeView,x:.5+Math.random()*.08,y:.38+Math.random()*.1}]);}
  function move(e){if(!drag.current||!stage.current)return;const r=stage.current.getBoundingClientRect();setOrder(null);setPlaced(a=>a.map(x=>x.uid===drag.current?{...x,x:Math.max(.08,Math.min(.92,(e.clientX-r.left)/r.width)),y:Math.max(.08,Math.min(.92,(e.clientY-r.top)/r.height))}:x));}
  function startDrag(e,uid){e.preventDefault();remember();drag.current=uid;e.currentTarget.setPointerCapture(e.pointerId);}
  function clearView(){if(!activePlaced.length)return show('Mặt này chưa có patch.');remember();setPlaced(a=>a.filter(x=>(x.view||'front')!==activeView));}
  function changeProduct(id){setProductId(id);setActiveView('front');setPlaced([]);setHistory([]);setSize('');setOrder(null);}

  async function makePNG(){
    const c=document.createElement('canvas');c.width=1200;c.height=1200;const ctx=c.getContext('2d');
    const draw=src=>new Promise((res,rej)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>res(im);im.onerror=rej;im.src=src;});
    ctx.fillStyle='#f8f6ef';ctx.fillRect(0,0,1200,1200);
    const cells=[{x:0,y:0},{x:600,y:0},{x:0,y:600},{x:600,y:600}];
    for(const [idx,view] of VIEWS.entries()){
      const cell=cells[idx],shirtSrc=(product?.view_images||{})[view.id]||(product?.view_images||{}).front||product?.image_url||defaultProduct.image_url;
      const tee=await draw(shirtSrc);
      ctx.fillStyle='#f1eddf';ctx.fillRect(cell.x,cell.y,600,600);ctx.drawImage(tee,cell.x,cell.y,600,600);
      ctx.fillStyle='#24212bcc';ctx.font='700 24px Manrope, sans-serif';ctx.fillText(view.label,cell.x+26,cell.y+42);
      for(const item of placed.filter(x=>(x.view||'front')===view.id)){
        const p=catalog.patches.find(x=>x.id===item.patchId);if(!p)continue;
        const im=await draw(p.image_url);
        const w=clampPatchPercent((Number(p.width_cm||4)/TEE_REFERENCE_WIDTH_CM)*100)*6,h=clampPatchPercent((Number(p.height_cm||4)/TEE_REFERENCE_HEIGHT_CM)*100)*6;
        ctx.drawImage(im,cell.x+item.x*600-w/2,cell.y+item.y*600-h/2,w,h);
      }
    }
    return await new Promise(resolve=>c.toBlob(resolve,'image/png'));
  }

  async function save(){
    if(!placed.length)throw Error('Thêm ít nhất một patch trước nhé.');
    if(!name.trim())throw Error('Nhập tên để shop nhận diện yêu cầu.');
    if(!size)throw Error('Chọn size áo trước nhé.');
    if(!consent)throw Error('Xác nhận quyền riêng tư để tiếp tục.');
    const blob=await makePNG(),f=new FormData();
    f.set('name',name.trim());f.set('size',size);f.set('mode',mode);f.set('productId',productId);f.set('note',note);
    f.set('patches',JSON.stringify(placed.map(x=>({patchId:x.patchId,view:x.view||'front',x:x.x,y:x.y}))));
    f.set('mockup',blob,'patchie-mockup.png');f.set('consent','true');
    const r=await fetch('/api/designs',{method:'POST',body:f}),d=await r.json();if(!r.ok)throw Error(d.error||'Chưa lưu được thiết kế.');
    return {id:d.id};
  }

  function orderMessage(id){
    const lines=placed.map(x=>{const p=catalog.patches.find(y=>y.id===x.patchId);return `- ${viewName(x.view)}: ${p?.name||x.patchId} (${Math.round(x.x*100)}%, ${Math.round(x.y*100)}%)`;}).join('\n');
    return `Chào Patchie! Mình muốn đặt áo custom.\nMã đơn: ${id}\nCách hoàn thiện: ${mode==='shop'?'Shop ủi giúp':'Tự ủi tại nhà'}\nÁo: ${product?.name||'Áo base'}${product?.sku?` / SKU: ${product.sku}`:''}\nSize: ${size}\nPatch:\n${lines}\nGhi chú: ${note||'Không có'}`;
  }

  async function placeOrder(){setBusy(true);try{const {id}=await save();setOrder({id,message:orderMessage(id)});show(`Đã tạo mã đơn ${id}.`);}catch(e){show(e.message);}finally{setBusy(false);}}
  async function copyOrder(){if(!order)return;try{await navigator.clipboard.writeText(order.message);show('Đã copy nội dung đơn.');}catch{show('Không copy được, bạn copy thủ công giúp mình nhé.');}}
  async function openMessenger(){if(!order)return;await copyOrder();if(catalog.settings.messengerUrl)window.open(catalog.settings.messengerUrl,'_blank','noopener,noreferrer');else show('Shop chưa cài link Messenger trong admin.');}

  return <main className="shell"><header className="topbar"><a className="brand" href="/"><span className="brand-mark">P</span> Patchie<span className="brand-studio">STUDIO</span></a><div className="toplinks"><span>Áo base · Patch thêu ủi</span><a href="/admin">Quản trị ↗</a></div></header>
    <section className="hero"><div><div className="eyebrow">YOUR TEE, YOUR LITTLE WORLD</div><h1>Tự tạo chiếc áo<br/><em>của riêng bạn.</em></h1><p>Chọn patch, kéo thả thử trên từng mặt áo rồi lấy mã đơn gửi shop. Mỗi mẫu áo có bộ mockup riêng theo SKU.</p></div><div className="hero-sticker">made<br/>by you <span>✳</span></div></section>
    <div className="workspace"><aside className="panel picker"><div className="panel-title"><div><small>01 / CHỌN PATCH</small><h2>Patch của bạn</h2></div><span className="counter">{placed.length}/12</span></div><p className="muted">Kích thước patch hiển thị theo số cm shop nhập trong admin.</p><div className="patch-grid">{catalog.patches.map(p=><button key={p.id} className={`patch-card ${chosen===p.id?'picked':''}`} onClick={()=>setChosen(p.id)}><span className="patch-img"><img src={p.image_url} alt={p.name}/></span><b>{p.name}</b><small>{patchLabel(p)}</small></button>)}</div><button className="button dark full" onClick={add}>＋ Thêm patch lên mặt đang chọn</button><div className="tip"><span>✦</span><p>Chọn mặt áo ở khu mockup, rồi thêm patch. Mỗi vị trí sẽ được lưu theo mặt áo riêng.</p></div><hr/><div className="form-field"><label>Mẫu áo / SKU</label><select value={productId} onChange={e=>changeProduct(e.target.value)}>{catalog.products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.color}{p.sku?` · ${p.sku}`:''}</option>)}</select></div><div className="form-field"><label>Size</label><div className="size-row">{sizes.map(s=><button type="button" key={s} className={`size ${size===s?'on':''}`} onClick={()=>setSize(s)}>{s}</button>)}</div></div></aside>
      <section className="preview-col"><div className="preview-head"><div><small>02 / SẮP XẾP</small><h2>Thử phối trên áo</h2></div><div className="editor-actions"><button onClick={undo} disabled={!history.length}>↶ Hoàn tác</button><button onClick={clearView}>Xóa mặt này</button></div></div><div className="view-tabs">{VIEWS.map(v=><button key={v.id} className={activeView===v.id?'active':''} onClick={()=>setActiveView(v.id)}>{v.short}<small>{placed.filter(x=>(x.view||'front')===v.id).length}</small></button>)}</div><div className="preview-card"><div className="stage" ref={stage} onPointerMove={move} onPointerUp={()=>drag.current=null} onPointerLeave={()=>drag.current=null}><img className="tee" src={activeImage} alt={`${product?.name||'Áo'} - ${viewName(activeView)}`}/>{activePlaced.map((x,i)=>{const p=catalog.patches.find(y=>y.id===x.patchId);return <button key={x.uid} className="placed-patch" aria-label={`Kéo patch ${p?.name}`} style={{left:`${x.x*100}%`,top:`${x.y*100}%`,zIndex:i+1,...patchPreviewStyle(p)}} onPointerDown={e=>startDrag(e,x.uid)}><img src={p?.image_url} alt={p?.name}/></button>})}{!activePlaced.length&&<div className="empty-nudge">Đang chỉnh: {viewName(activeView)} <span>↗</span></div>}</div><div className="preview-foot"><span>{product?.sku?`SKU ${product.sku}`:'Mockup theo mẫu áo'}</span><span>{viewName(activeView)}</span></div></div><div className="method-row"><button className={mode==='diy'?'method active':'method'} onClick={()=>setMode('diy')}><span>🏠</span><b>Tự ủi tại nhà</b><small>Nhận patch rời cùng áo base</small></button><button className={mode==='shop'?'method active':'method'} onClick={()=>setMode('shop')}><span>🪡</span><b>Shop ủi giúp</b><small>Gửi mã đơn, shop làm theo</small></button></div></section>
      <aside className="panel request"><div className="panel-title"><div><small>03 / ĐẶT ĐƠN</small><h2>Lưu thiết kế</h2></div><span className="spark">✳</span></div><p className="muted">Website không thanh toán. Bấm đặt đơn để lấy mã, copy rồi gửi Messenger cho shop.</p><div className="form-field"><label>Tên của bạn</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Tên để shop nhận diện" maxLength={80}/></div><div className="form-field"><label>Ghi chú <span>(không bắt buộc)</span></label><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Màu áo, vị trí patch mong muốn…" rows={3} maxLength={1200}/></div><label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>{catalog.settings.privacyText}</span></label><button className="button coral full send-button" onClick={placeOrder} disabled={busy}>{busy?'Đang tạo mã…':'Đặt đơn'}</button>{order&&<div className="order-code-card"><span>Mã đơn của bạn</span><div className="order-code-row"><b>{order.id}</b><button type="button" onClick={copyOrder}>Copy</button><button type="button" className="messenger-btn" onClick={openMessenger}>m</button></div><small>Copy mã đơn hoặc bấm Messenger để gửi nội dung cho shop.</small></div>}<div className="tiny-note">Shop sẽ xem mockup 4 mặt trong admin và xác nhận trước khi chốt.</div></aside></div>
    <footer><span>Patchie · Customize your everyday</span><span>Chọn patch · Tạo mã đơn · Gửi shop</span></footer>{toast&&<div className="toast">{toast}</div>}</main>;
}
