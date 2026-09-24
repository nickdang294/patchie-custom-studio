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

const VIEW_REFERENCE_CM={
  front:{width:62.5,height:62.5},
  back:{width:62.5,height:62.5},
  left_sleeve:{width:24,height:24},
  right_sleeve:{width:24,height:24}
};
const clampPatchPercent=value=>Math.max(.8,Math.min(35,value));
const clampZoom=value=>Math.max(1,Math.min(3.2,value));
const defaultProduct={id:'base-offwhite',sku:'BASE-OFFWHITE',name:'Áo thun oversized',color:'Off-white',hex:'#f5f1e8',image_url:'/assets/blank-tee.webp',view_images:{front:'/assets/blank-tee.webp'},sizes:['S','M','L','XL'],price:null};

export default function Home(){
  const [catalog,setCatalog]=useState({products:[defaultProduct],patches:STARTER,settings:{sizes:['S','M','L','XL'],messengerUrl:'',privacyText:'Shop dùng thông tin này để xử lý yêu cầu thiết kế.'}});
  const [chosen,setChosen]=useState(STARTER[0].id),[placed,setPlaced]=useState([]),[history,setHistory]=useState([]),[selectedUid,setSelectedUid]=useState(''),[activeView,setActiveView]=useState('front'),[flowDone,setFlowDone]=useState(false),[stageZoom,setStageZoom]=useState({scale:1,x:0,y:0}),[trashActive,setTrashActive]=useState(false),[trashHot,setTrashHot]=useState(false),[mode,setMode]=useState('shop'),[productId,setProductId]=useState(defaultProduct.id),[size,setSize]=useState(''),[name,setName]=useState(''),[phone,setPhone]=useState(''),[address,setAddress]=useState(''),[note,setNote]=useState(''),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[toast,setToast]=useState(''),[order,setOrder]=useState(null);
  const stage=useRef(null),trash=useRef(null),drag=useRef(null),pan=useRef(null),rotating=useRef(false),pinch=useRef(null);
  const product=catalog.products.find(x=>x.id===productId)||catalog.products[0]||defaultProduct;
  const sizes=product?.sizes?.length?product.sizes:catalog.settings.sizes||[];
  const chosenPatch=catalog.patches.find(x=>x.id===chosen);
  const viewImages=product?.view_images||{};
  const activeImage=viewImages[activeView]||viewImages.front||product?.image_url||defaultProduct.image_url;
  const activePlaced=placed.filter(x=>(x.view||'front')===activeView);
  const selectedItem=activePlaced.find(x=>x.uid===selectedUid);
  const selectedPatch=selectedItem&&catalog.patches.find(x=>x.id===selectedItem.patchId);
  const show=s=>{setToast(s);setTimeout(()=>setToast(''),2600)};
  const patchSizePercent=(p,view=activeView)=>{const ref=VIEW_REFERENCE_CM[view]||VIEW_REFERENCE_CM.front;return {width:clampPatchPercent((Number(p?.width_cm||4)/ref.width)*100),height:clampPatchPercent((Number(p?.height_cm||4)/ref.height)*100)};};
  const patchPreviewStyle=p=>{const s=patchSizePercent(p);return {width:`${s.width}%`,height:`${s.height}%`,maxWidth:'none',maxHeight:'none'};};
  const patchLabel=p=>`${Number(p?.width_cm||4).toFixed(1).replace('.0','')} × ${Number(p?.height_cm||4).toFixed(1).replace('.0','')} cm`;
  const viewName=id=>VIEWS.find(v=>v.id===id)?.label||'Mặt trước';
  const stepIndex=Math.max(0,VIEWS.findIndex(v=>v.id===activeView));
  const isLastStep=stepIndex===VIEWS.length-1;
  const money=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?`${new Intl.NumberFormat('vi-VN').format(Number(v))}đ`:'Chưa set';
  const priceOf=x=>Number.isFinite(Number(x?.price))?Number(x.price):0;
  const placedWithPatch=placed.map(x=>({...x,patch:catalog.patches.find(p=>p.id===x.patchId)}));
  const productPrice=priceOf(product),patchTotal=placedWithPatch.reduce((sum,x)=>sum+priceOf(x.patch),0),orderTotal=productPrice+patchTotal;
  const normalizeRotation=value=>((Math.round(Number(value)||0)%360)+360)%360;
  const signedRotation=value=>{const v=normalizeRotation(value);return v>180?v-360:v;};

  useEffect(()=>{fetch('/api/catalog').then(r=>r.json()).then(d=>{if(d.products?.length&&d.patches?.length){setCatalog(d);setProductId(d.products[0].id);setChosen(d.patches[0].id);}}).catch(()=>{});},[]);
  useEffect(()=>{setStageZoom({scale:1,x:0,y:0});setTrashActive(false);setTrashHot(false);pinch.current=null;drag.current=null;pan.current=null;},[activeView,productId]);

  function remember(){setHistory(a=>[...a.slice(-19),placed.map(x=>({...x}))]);setOrder(null);}
  function undo(){setHistory(a=>{const prev=a[a.length-1];if(!prev){show('Chưa có bước để hoàn tác.');return a;}setPlaced(prev.map(x=>({...x})));setOrder(null);return a.slice(0,-1);});}
  function add(){if(!chosenPatch)return show('Chọn một patch trước nhé.');if(placed.length>=12)return show('Bố cục tối đa 12 patch.');remember();const uid=crypto.randomUUID();setSelectedUid(uid);setPlaced(a=>[...a,{uid,patchId:chosen,view:activeView,x:.5+Math.random()*.08,y:.38+Math.random()*.1,rotation:0}]);}
  function isOverTrash(e){if(!trash.current)return false;const r=trash.current.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;}
  function removeDraggedPatch(uid){setPlaced(a=>a.filter(x=>x.uid!==uid));if(selectedUid===uid)setSelectedUid('');show('Đã xoá patch.');}
  function move(e){if(!drag.current||!stage.current||pinch.current)return;const r=stage.current.getBoundingClientRect();const x=(e.clientX-r.left-stageZoom.x)/(r.width*stageZoom.scale),y=(e.clientY-r.top-stageZoom.y)/(r.height*stageZoom.scale);setTrashHot(isOverTrash(e));setOrder(null);setPlaced(a=>a.map(item=>item.uid===drag.current?{...item,x:Math.max(.08,Math.min(.92,x)),y:Math.max(.08,Math.min(.92,y))}:item));}
  function startDrag(e,uid){e.preventDefault();e.stopPropagation();setSelectedUid(uid);setTrashActive(true);setTrashHot(isOverTrash(e));remember();pan.current=null;drag.current=uid;e.currentTarget.setPointerCapture(e.pointerId);}
  function startPan(e){if(stageZoom.scale<=1||e.target.closest?.('.placed-patch'))return;e.preventDefault();setSelectedUid('');drag.current=null;pan.current={x:e.clientX,y:e.clientY,zoom:{...stageZoom}};e.currentTarget.setPointerCapture(e.pointerId);}
  function movePan(e){if(!pan.current||!stage.current||pinch.current)return;const r=stage.current.getBoundingClientRect(),start=pan.current;setStageZoom(containZoom({...start.zoom,x:start.zoom.x+e.clientX-start.x,y:start.zoom.y+e.clientY-start.y},r));}
  function moveStage(e){if(drag.current)move(e);else movePan(e);}
  function endStage(e){const uid=drag.current;if(uid&&e&&isOverTrash(e))removeDraggedPatch(uid);drag.current=null;pan.current=null;setTrashActive(false);setTrashHot(false);}
  function clearView(){if(!activePlaced.length)return show('Mặt này chưa có patch.');remember();setPlaced(a=>a.filter(x=>(x.view||'front')!==activeView));setSelectedUid('');}
  function changeProduct(id){setProductId(id);setActiveView('front');setFlowDone(false);setPlaced([]);setHistory([]);setSelectedUid('');setSize('');setOrder(null);}
  function beginRotate(){if(!selectedItem||rotating.current)return;remember();rotating.current=true;}
  function endRotate(){rotating.current=false;}
  function rotateSelected(value){if(!selectedUid)return;const rotation=normalizeRotation(value);setOrder(null);setPlaced(a=>a.map(x=>x.uid===selectedUid?{...x,rotation}:x));}
  function nudgeRotate(delta){if(!selectedItem)return show('Chọn patch cần xoay trước nhé.');remember();rotateSelected((Number(selectedItem.rotation)||0)+delta);}
  const touchPoint=(t,r)=>({x:t.clientX-r.left,y:t.clientY-r.top});
  const touchDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function containZoom(next,r){
    if(next.scale<=1)return {scale:1,x:0,y:0};
    const min=r.width-(r.width*next.scale),minY=r.height-(r.height*next.scale);
    return {scale:next.scale,x:Math.max(min,Math.min(0,next.x)),y:Math.max(minY,Math.min(0,next.y))};
  }
  function startPinch(e){
    if(e.touches.length!==2||!stage.current)return;
    e.preventDefault();drag.current=null;pan.current=null;
    const r=stage.current.getBoundingClientRect(),a=touchPoint(e.touches[0],r),b=touchPoint(e.touches[1],r),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    pinch.current={dist:touchDistance(a,b),mid,zoom:{...stageZoom}};
  }
  function movePinch(e){
    if(e.touches.length!==2||!pinch.current||!stage.current)return;
    e.preventDefault();
    const r=stage.current.getBoundingClientRect(),a=touchPoint(e.touches[0],r),b=touchPoint(e.touches[1],r),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},start=pinch.current;
    const scale=clampZoom(start.zoom.scale*(touchDistance(a,b)/Math.max(1,start.dist))),contentX=(start.mid.x-start.zoom.x)/start.zoom.scale,contentY=(start.mid.y-start.zoom.y)/start.zoom.scale;
    setStageZoom(containZoom({scale,x:mid.x-contentX*scale,y:mid.y-contentY*scale},r));
  }
  function endPinch(e){if(e.touches.length<2)pinch.current=null;}
  function advanceStep(skipped=false){
    if(skipped&&activePlaced.length){remember();setPlaced(a=>a.filter(x=>(x.view||'front')!==activeView));}
    setSelectedUid('');
    if(!isLastStep){setActiveView(VIEWS[stepIndex+1].id);show(skipped?'Đã bỏ qua mặt này.':'Đã lưu bước này.');return;}
    setFlowDone(true);
    show('Xong 4 vị trí. Nhập thông tin để đặt đơn nhé.');
    setTimeout(()=>document.querySelector('.request')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }
  function finishCustom(){setFlowDone(true);setSelectedUid('');show('Xong mockup. Nhập thông tin để đặt đơn nhé.');setTimeout(()=>document.querySelector('.request')?.scrollIntoView({behavior:'smooth',block:'start'}),80);}
  function jumpView(id){setActiveView(id);setSelectedUid('');}

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
        const size=patchSizePercent(p,view.id),w=size.width*6,h=size.height*6;
        ctx.save();ctx.translate(cell.x+item.x*600,cell.y+item.y*600);ctx.rotate((Number(item.rotation)||0)*Math.PI/180);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();
      }
    }
    return await new Promise(resolve=>c.toBlob(resolve,'image/png'));
  }

  async function save(){
    if(!flowDone)throw Error('Đi hết 4 bước vị trí trước nhé. Có thể bấm bỏ qua ở mặt không cần patch.');
    if(!placed.length)throw Error('Thêm ít nhất một patch trước nhé.');
    if(!name.trim())throw Error('Nhập tên để shop nhận diện yêu cầu.');
    if(!phone.trim())throw Error('Nhập số điện thoại để shop liên hệ.');
    if(!address.trim())throw Error('Nhập địa chỉ nhận hàng.');
    if(!size)throw Error('Chọn size áo trước nhé.');
    if(!consent)throw Error('Xác nhận quyền riêng tư để tiếp tục.');
    const blob=await makePNG(),f=new FormData();
    f.set('name',name.trim());f.set('phone',phone.trim());f.set('address',address.trim());f.set('size',size);f.set('mode',mode);f.set('productId',productId);f.set('note',note);
    f.set('patches',JSON.stringify(placed.map(x=>({patchId:x.patchId,view:x.view||'front',x:x.x,y:x.y,rotation:normalizeRotation(x.rotation)}))));
    f.set('mockup',blob,'patchie-mockup.png');f.set('consent','true');
    const r=await fetch('/api/designs',{method:'POST',body:f}),d=await r.json();if(!r.ok)throw Error(d.error||'Chưa lưu được thiết kế.');
    return {id:d.id};
  }

  function orderMessage(id){
    const lines=placedWithPatch.map(x=>`- ${viewName(x.view)}: ${x.patch?.name||x.patchId} · ${money(x.patch?.price)} · xoay ${normalizeRotation(x.rotation)}° (${Math.round(x.x*100)}%, ${Math.round(x.y*100)}%)`).join('\n');
    return `Chào Patchie! Mình muốn đặt áo custom.\nMã đơn: ${id}\nTên: ${name.trim()}\nSĐT: ${phone.trim()}\nĐịa chỉ nhận hàng: ${address.trim()}\nCách hoàn thiện: ${mode==='shop'?'Shop ủi giúp':'Tự ủi tại nhà'}\nÁo: ${product?.name||'Áo base'}${product?.sku?` / SKU: ${product.sku}`:''}\nGiá áo: ${money(product?.price)}\nSize: ${size}\nPatch:\n${lines}\nTổng tạm tính: ${money(orderTotal)}\nGhi chú: ${note||'Không có'}`;
  }

  async function placeOrder(){setBusy(true);try{const {id}=await save();setOrder({id,message:orderMessage(id)});show(`Đã tạo mã đơn ${id}.`);}catch(e){show(e.message);}finally{setBusy(false);}}
  async function copyOrder(){if(!order)return;try{await navigator.clipboard.writeText(order.message);show('Đã copy nội dung đơn.');}catch{show('Không copy được, bạn copy thủ công giúp mình nhé.');}}
  async function openMessenger(){if(!order)return;await copyOrder();if(catalog.settings.messengerUrl)window.open(catalog.settings.messengerUrl,'_blank','noopener,noreferrer');else show('Shop chưa cài link Messenger trong admin.');}

  return <main className="shell"><header className="topbar"><a className="brand" href="/"><span className="brand-mark">P</span> Patchie<span className="brand-studio">STUDIO</span></a><div className="toplinks"><span>Áo base · Patch thêu ủi</span><a href="/admin">Quản trị ↗</a></div></header>
    <section className="hero"><div><div className="eyebrow">YOUR TEE, YOUR LITTLE WORLD</div><h1>Tự tạo chiếc áo<br/><em>của riêng bạn.</em></h1><p>Chọn patch, chạm vào vùng áo muốn custom, rồi bấm hoàn tất khi đã ưng ý.</p></div><div className="hero-sticker">made<br/>by you <span>✳</span></div></section>
    <div className="workspace"><aside className="panel picker"><div className="panel-title"><div><small>01 / CHỌN PATCH</small><h2>Patch của bạn</h2></div><span className="counter">{placed.length}/12</span></div><p className="muted">Kích thước patch hiển thị theo số cm shop nhập trong admin.</p><div className="patch-grid">{catalog.patches.map(p=><button key={p.id} className={`patch-card ${chosen===p.id?'picked':''}`} onClick={()=>setChosen(p.id)}><span className="patch-img"><img src={p.image_url} alt={p.name}/></span><b>{p.name}</b><small>{patchLabel(p)}</small><strong className="price-tag">{money(p.price)}</strong></button>)}</div><button className="button dark full" onClick={add}>＋ Thêm patch lên mặt đang chọn</button><div className="tip"><span>✦</span><p>Chọn mặt áo ở khu mockup, rồi thêm patch. Mỗi vị trí sẽ được lưu theo mặt áo riêng.</p></div><hr/><div className="form-field"><label>Mẫu áo / SKU</label><select value={productId} onChange={e=>changeProduct(e.target.value)}>{catalog.products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.color}{p.sku?` · ${p.sku}`:''} · {money(p.price)}</option>)}</select><small className="field-note">Giá áo base: {money(product?.price)}</small></div><div className="form-field"><label>Size</label><div className="size-row">{sizes.map(s=><button type="button" key={s} className={`size ${size===s?'on':''}`} onClick={()=>setSize(s)}>{s}</button>)}</div></div></aside>
      <section className="preview-col"><div className="preview-head"><div><small>02 / SẮP XẾP</small><h2>{flowDone?'Xem lại mockup':'Bước '+(stepIndex+1)+' · '+viewName(activeView)}</h2></div><div className="editor-actions"><button onClick={undo} disabled={!history.length}>↶ Hoàn tác</button><button onClick={clearView}>Xóa mặt này</button></div></div><div className="mobile-patch-dock"><div className="mobile-dock-head"><b>Chọn patch trước</b><span>{placed.length}/12</span></div><div className="mobile-patch-strip">{catalog.patches.map(p=><button key={p.id} className={`patch-card ${chosen===p.id?'picked':''}`} onClick={()=>setChosen(p.id)}><span className="patch-img"><img src={p.image_url} alt={p.name}/></span><b>{p.name}</b><small>{patchLabel(p)}</small><strong className="price-tag">{money(p.price)}</strong></button>)}</div><button className="button dark full" onClick={add}>＋ Thêm patch vào {viewName(activeView).toLowerCase()}</button></div><div className="view-tabs guided-tabs">{VIEWS.map((v,i)=><button key={v.id} className={`${activeView===v.id?'active':''} ${i<stepIndex||flowDone?'done':''} ${v.id.includes('sleeve')?'sleeve-tab':''}`} onClick={()=>jumpView(v.id)}><span>{i+1}</span>{v.short}<small>{placed.filter(x=>(x.view||'front')===v.id).length}</small></button>)}</div><div className="preview-card"><div className={`stage ${stageZoom.scale>1?'is-zoomed':''}`} ref={stage} onPointerDown={startPan} onPointerMove={moveStage} onPointerUp={endStage} onPointerLeave={endStage} onTouchStart={startPinch} onTouchMove={movePinch} onTouchEnd={endPinch} onTouchCancel={endPinch}><div className="stage-zoom-layer" style={{transform:`translate(${stageZoom.x}px,${stageZoom.y}px) scale(${stageZoom.scale})`}}><img className="tee" src={activeImage} alt={`${product?.name||'Áo'} - ${viewName(activeView)}`}/>{activePlaced.map((x,i)=>{const p=catalog.patches.find(y=>y.id===x.patchId);return <button key={x.uid} className={`placed-patch ${selectedUid===x.uid?'selected':''}`} aria-label={`Kéo patch ${p?.name}`} style={{left:`${x.x*100}%`,top:`${x.y*100}%`,zIndex:i+1,transform:`translate(-50%,-50%) rotate(${normalizeRotation(x.rotation)}deg)`,...patchPreviewStyle(p)}} onPointerDown={e=>startDrag(e,x.uid)}><img src={p?.image_url} alt={p?.name}/></button>})}</div>{activeView==='front'&&<div className="mobile-sleeve-hotspots"><button type="button" className="sleeve-hotspot sleeve-left" onPointerDown={e=>e.stopPropagation()} onClick={()=>jumpView('right_sleeve')}><b>Tay phải</b><small>{placed.filter(x=>(x.view||'front')==='right_sleeve').length}</small></button><button type="button" className="sleeve-hotspot sleeve-right" onPointerDown={e=>e.stopPropagation()} onClick={()=>jumpView('left_sleeve')}><b>Tay trái</b><small>{placed.filter(x=>(x.view||'front')==='left_sleeve').length}</small></button><button type="button" className="sleeve-hotspot back-hotspot" onPointerDown={e=>e.stopPropagation()} onClick={()=>jumpView('back')}><b>↩ Mặt sau</b><small>{placed.filter(x=>(x.view||'front')==='back').length}</small></button></div>}{activeView!=='front'&&<div className="mobile-front-hotspot"><button type="button" onPointerDown={e=>e.stopPropagation()} onClick={()=>jumpView('front')}>← Mặt trước</button></div>}<button type="button" className="undo-float" onPointerDown={e=>e.stopPropagation()} onClick={undo} disabled={!history.length} aria-label="Hoàn tác">↺</button><div ref={trash} className={`trash-zone ${trashActive||selectedItem?'is-active':''} ${trashHot?'is-hot':''}`} aria-hidden="true"><span>🗑</span><small>Thả để xoá</small></div>{!activePlaced.length&&<div className="empty-nudge">Thêm patch hoặc bỏ qua mặt này <span>↗</span></div>}{activePlaced.length>0&&stageZoom.scale===1&&<div className="pinch-nudge">Dùng 2 ngón để zoom, kéo nền để soi áo</div>}</div>{selectedItem&&<div className="rotate-panel rotate-panel-vertical" aria-label="Xoay patch"><input className="vertical-range" type="range" min="-180" max="180" value={signedRotation(selectedItem.rotation)} onPointerDown={beginRotate} onPointerUp={endRotate} onTouchStart={beginRotate} onTouchEnd={endRotate} onChange={e=>rotateSelected(e.target.value)}/><b>{signedRotation(selectedItem.rotation)}°</b><small>{selectedPatch?.name}</small></div>}<div className="preview-foot"><span>{product?.sku?`SKU ${product.sku}`:'Mockup theo mẫu áo'}</span><span>{viewName(activeView)}</span></div></div><div className="mobile-config"><div className="form-field"><label>Mẫu áo / SKU</label><select value={productId} onChange={e=>changeProduct(e.target.value)}>{catalog.products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.color}{p.sku?` · ${p.sku}`:''} · {money(p.price)}</option>)}</select></div><div className="form-field"><label>Size</label><div className="size-row">{sizes.map(s=><button type="button" key={s} className={`size ${size===s?'on':''}`} onClick={()=>setSize(s)}>{s}</button>)}</div></div></div><button type="button" className="button dark finish-custom" onClick={finishCustom}>Đã custom xong rồi</button><div className="method-row"><button className={mode==='diy'?'method active':'method'} onClick={()=>setMode('diy')}><span>🏠</span><b>Tự ủi tại nhà</b><small>Nhận patch rời cùng áo base</small></button><button className={mode==='shop'?'method active':'method'} onClick={()=>setMode('shop')}><span>🪡</span><b>Shop ủi giúp</b><small>Gửi mã đơn, shop làm theo</small></button></div></section>
      <aside className={`panel request ${flowDone?'':'request-locked'}`}><div className="panel-title"><div><small>03 / ĐẶT ĐƠN</small><h2>Thông tin nhận hàng</h2></div><span className="spark">✳</span></div>{!flowDone?<div className="locked-note"><b>Hoàn tất mockup trước</b><p>Custom các vùng áo cần dùng, sau đó bấm “Đã custom xong rồi” để nhập thông tin đặt đơn.</p></div>:<><p className="muted">Website không thanh toán. Bấm đặt đơn để lấy mã, copy rồi gửi Messenger cho shop.</p><div className="price-summary"><div><span>Áo base</span><b>{money(product?.price)}</b></div><div><span>Patch × {placed.length}</span><b>{money(patchTotal)}</b></div><div className="total"><span>Tổng tạm tính</span><b>{money(orderTotal)}</b></div></div><div className="form-field"><label>Tên của bạn</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Tên người nhận" maxLength={80}/></div><div className="form-field"><label>Số điện thoại</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="SĐT để shop liên hệ" inputMode="tel" maxLength={30}/></div><div className="form-field"><label>Địa chỉ nhận hàng</label><textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" rows={3} maxLength={500}/></div><div className="form-field"><label>Ghi chú <span>(không bắt buộc)</span></label><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Màu áo, yêu cầu thêm…" rows={3} maxLength={1200}/></div><label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>{catalog.settings.privacyText}</span></label><button className="button coral full send-button" onClick={placeOrder} disabled={busy}>{busy?'Đang tạo mã…':'Đặt đơn'}</button>{order&&<div className="order-code-card"><span>Mã đơn của bạn</span><div className="order-code-row"><b>{order.id}</b><button type="button" onClick={copyOrder}>Copy</button><button type="button" className="messenger-btn" onClick={openMessenger}>m</button></div><small>Copy mã đơn hoặc bấm Messenger để gửi nội dung cho shop.</small></div>}<div className="tiny-note">Shop sẽ xem mockup 4 mặt trong admin và xác nhận trước khi chốt.</div></>}</aside></div>
    <footer><span>Patchie · Customize your everyday</span><span>Chọn patch · Tạo mã đơn · Gửi shop</span></footer>{toast&&<div className="toast">{toast}</div>}</main>;
}
