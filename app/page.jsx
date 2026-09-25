'use client';

import { useEffect, useRef, useState } from 'react';

const STARTER=[
  {id:'patch-pink',name:'Mũ xanh lá',image_url:'/assets/patch-pink-cap.webp',width_cm:4,height_cm:4,quote:'nhỏ xíu mà có võ',patch_group:'Best Seller',patch_groups:['Best Seller']},
  {id:'patch-black',name:'Mặt nạ xanh',image_url:'/assets/patch-black-green.webp',width_cm:4,height_cm:4,quote:'bí ẩn một chút mới vui',patch_group:'Limited',patch_groups:['Limited']},
  {id:'patch-red',name:'Mũ vàng',image_url:'/assets/patch-red-white.webp',width_cm:4,height_cm:4,quote:'đội mood vui lên áo',patch_group:'Seasonal',patch_groups:['Seasonal']},
  {id:'patch-yellow',name:'Mũ xanh dương',image_url:'/assets/patch-yellow-blue.webp',width_cm:4,height_cm:4,quote:'hôm nay hơi đáng yêu',patch_group:'Cute Animal',patch_groups:['Cute Animal']}
];

const PATCH_GROUPS=['Best Seller','Chữ Cái','Seasonal','Limited','Cute Animal','Floral'];
const cleanGroups=list=>Array.from(new Set((Array.isArray(list)?list:String(list||'').split(',')).map(x=>String(x).trim()).filter(Boolean)));
const patchGroupsOf=p=>cleanGroups(p?.patch_groups?.length?p.patch_groups:(p?.patch_group||'Best Seller'));
const patchGroup=p=>patchGroupsOf(p)[0]||'Best Seller';

const VIEWS=[
  {id:'front',label:'Mặt trước',short:'Trước'},
  {id:'left_sleeve',label:'Tay áo trái',short:'Tay trái'},
  {id:'right_sleeve',label:'Tay áo phải',short:'Tay phải'},
  {id:'back',label:'Lưng áo',short:'Lưng'}
];
const PRODUCT_VIEW_SETS={shirt:['front','left_sleeve','right_sleeve','back'],bag:['front','back']};
const viewsForProduct=p=>VIEWS.filter(v=>(PRODUCT_VIEW_SETS[p?.product_type||'shirt']||PRODUCT_VIEW_SETS.shirt).includes(v.id));
const PRODUCT_GROUPS=[
  {value:'shirt',label:'Áo Tee'},
  {value:'bag',label:'Túi Tote'}
];
const productGroupLabel=value=>PRODUCT_GROUPS.find(g=>g.value===value)?.label||'Sản phẩm';
const productBaseKey=p=>p?.base_key||`${p?.product_type||'shirt'}::${String(p?.name||'').trim().toLowerCase()}`;

const VIEW_REFERENCE_CM={
  front:{width:62.5,height:62.5},
  back:{width:62.5,height:62.5},
  left_sleeve:{width:24,height:24},
  right_sleeve:{width:24,height:24}
};
const clampPatchPercent=value=>Math.max(.8,Math.min(35,value));
const clampZoom=value=>Math.max(1,Math.min(3.2,value));
const defaultProduct={id:'base-offwhite',sku:'BASE-OFFWHITE',product_type:'shirt',name:'Áo thun oversized',color:'Off-white',hex:'#f5f1e8',image_url:'/assets/blank-tee.webp',view_images:{front:'/assets/blank-tee.webp'},sizes:['S','M','L','XL'],price:null};
const BRAND_DEFAULTS={brandName:'Patchie',logoUrl:'',slogan:'Customize your everyday',fontFamily:'DM Sans',heroEyebrow:'YOUR BASE, YOUR LITTLE WORLD',heroTitle:'Tự tạo món đồ',heroAccent:'của riêng bạn.',heroDescription:'Chọn patch, chạm vào vùng muốn custom, rồi bấm hoàn tất khi đã ưng ý.',step1Label:'01 / CHỌN PATCH',step1Title:'Patch của bạn',step2Label:'02 / SẮP XẾP',step3Label:'03 / ĐẶT ĐƠN',step1Desktop:'01 / CHỌN PATCH',step1Mobile:'01 / CHỌN PATCH',step2Desktop:'02 / SẮP XẾP',step2Mobile:'02 / SẮP XẾP',addPatchLabel:'＋ Thêm patch lên mặt đang chọn',mobileAddPatchLabel:'＋ Thêm patch vào mặt đang chọn',productGroupImages:{shirt:'',bag:''}};
const cssContent=value=>JSON.stringify(String(value||''));
const BrandIdentity=({brand=BRAND_DEFAULTS})=><>{brand.logoUrl?<img className="brand-logo" src={brand.logoUrl} alt=""/>:<span className="brand-mark">P</span>} {brand.brandName||'Patchie'}<span className="brand-studio">STUDIO</span></>;

export default function Home(){
  const [catalog,setCatalog]=useState({products:[defaultProduct],patches:STARTER,settings:{sizes:['S','M','L','XL'],messengerUrl:'',privacyText:'Shop dùng thông tin này để xử lý yêu cầu thiết kế.',brand:BRAND_DEFAULTS}});
  const [chosen,setChosen]=useState(STARTER[0].id),[activePatchGroup,setActivePatchGroup]=useState('all'),[placed,setPlaced]=useState([]),[history,setHistory]=useState([]),[selectedUid,setSelectedUid]=useState(''),[activeView,setActiveView]=useState('front'),[flowDone,setFlowDone]=useState(false),[stageZoom,setStageZoom]=useState({scale:1,x:0,y:0}),[trashActive,setTrashActive]=useState(false),[trashHot,setTrashHot]=useState(false),[mode,setMode]=useState('shop'),[productId,setProductId]=useState(defaultProduct.id),[productSheetGroup,setProductSheetGroup]=useState(defaultProduct.product_type),[size,setSize]=useState(''),[name,setName]=useState(''),[phone,setPhone]=useState(''),[address,setAddress]=useState(''),[note,setNote]=useState(''),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[toast,setToast]=useState(''),[order,setOrder]=useState(null),[quotePatch,setQuotePatch]=useState(''),[celebrate,setCelebrate]=useState(false),[undoAsk,setUndoAsk]=useState(false),[undoAsked,setUndoAsked]=useState(false),[selectSheet,setSelectSheet]=useState(null),[catalogReady,setCatalogReady]=useState(false);
  const stage=useRef(null),trash=useRef(null),drag=useRef(null),pan=useRef(null),rotating=useRef(false),pinch=useRef(null);
  const product=catalog.products.find(x=>x.id===productId)||catalog.products[0]||defaultProduct;
  const savedBrand=catalog.settings.brand||{};
  const brand={...BRAND_DEFAULTS,...savedBrand,step1Desktop:savedBrand.step1Desktop||savedBrand.step1Label||BRAND_DEFAULTS.step1Desktop,step1Mobile:savedBrand.step1Mobile||savedBrand.step1Label||BRAND_DEFAULTS.step1Mobile,step2Desktop:savedBrand.step2Desktop||savedBrand.step2Label||BRAND_DEFAULTS.step2Desktop,step2Mobile:savedBrand.step2Mobile||savedBrand.step2Label||BRAND_DEFAULTS.step2Mobile,productGroupImages:{...BRAND_DEFAULTS.productGroupImages,...(savedBrand.productGroupImages||{})}};
  const selectedBaseKey=productBaseKey(product);
  const colorVariants=catalog.products.filter(p=>productBaseKey(p)===selectedBaseKey);
  const activeViews=viewsForProduct(product);
  const sizes=product?.sizes?.length?product.sizes:catalog.settings.sizes||[];
  const chosenPatch=catalog.patches.find(x=>x.id===chosen);
  const existingPatchGroups=Array.from(new Set(catalog.patches.flatMap(patchGroupsOf)));
  const patchGroups=['all',...PATCH_GROUPS.filter(g=>existingPatchGroups.includes(g)),...existingPatchGroups.filter(g=>!PATCH_GROUPS.includes(g))];
  const patchGroupCount=g=>g==='all'?catalog.patches.length:catalog.patches.filter(p=>patchGroupsOf(p).includes(g)).length;
  const visiblePatches=activePatchGroup==='all'?catalog.patches:catalog.patches.filter(p=>patchGroupsOf(p).includes(activePatchGroup));
  const viewImages=product?.view_images||{};
  const imageForView=id=>viewImages[id]||viewImages.front||product?.image_url||defaultProduct.image_url;
  const activeImage=imageForView(activeView);
  const activePlaced=placed.filter(x=>(x.view||'front')===activeView);
  const selectedItem=activePlaced.find(x=>x.uid===selectedUid);
  const selectedPatch=selectedItem&&catalog.patches.find(x=>x.id===selectedItem.patchId);
  const show=s=>{setToast(s);setTimeout(()=>setToast(''),2600);};
  const flashQuote=p=>{if(!p?.quote)return;setQuotePatch(p.id);setTimeout(()=>setQuotePatch(''),1000);};
  const choosePatch=p=>{setChosen(p.id);flashQuote(p);};
  const patchSizePercent=(p,view=activeView)=>{const ref=VIEW_REFERENCE_CM[view]||VIEW_REFERENCE_CM.front;return {width:clampPatchPercent((Number(p?.width_cm||4)/ref.width)*100),height:clampPatchPercent((Number(p?.height_cm||4)/ref.height)*100)};};
  const patchPreviewStyle=p=>{const s=patchSizePercent(p);return {width:`${s.width}%`,height:`${s.height}%`,maxWidth:'none',maxHeight:'none'};};
  const patchLabel=p=>`${Number(p?.width_cm||4).toFixed(1).replace('.0','')} × ${Number(p?.height_cm||4).toFixed(1).replace('.0','')} cm`;
  const viewName=id=>VIEWS.find(v=>v.id===id)?.label||'Mặt trước';
  const stepIndex=Math.max(0,activeViews.findIndex(v=>v.id===activeView));
  const isLastStep=stepIndex===activeViews.length-1;
  const money=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?`${new Intl.NumberFormat('vi-VN').format(Number(v))}đ`:'Chưa set';
  const priceOf=x=>Number.isFinite(Number(x?.price))?Number(x.price):0;
  const placedWithPatch=placed.map(x=>({...x,patch:catalog.patches.find(p=>p.id===x.patchId)}));
  const productPrice=priceOf(product),patchTotal=placedWithPatch.reduce((sum,x)=>sum+priceOf(x.patch),0),orderTotal=productPrice+patchTotal;
  const normalizeRotation=value=>((Math.round(Number(value)||0)%360)+360)%360;
  const signedRotation=value=>{const v=normalizeRotation(value);return v>180?v-360:v;};

  useEffect(()=>{fetch('/api/catalog').then(r=>r.json()).then(d=>{const products=Array.isArray(d.products)?d.products:[],patches=Array.isArray(d.patches)?d.patches:[];setCatalog({products,patches:patches.length?patches:STARTER,settings:{sizes:['S','M','L','XL'],messengerUrl:'',privacyText:'Shop dùng thông tin này để xử lý yêu cầu thiết kế.',...(d.settings||{})}});if(products.length)setProductId(products[0].id);if(patches.length)setChosen(patches[0].id);}).catch(()=>{}).finally(()=>setCatalogReady(true));},[]);
  useEffect(()=>{if(visiblePatches.length&&!visiblePatches.some(p=>p.id===chosen))setChosen(visiblePatches[0].id);},[activePatchGroup,catalog.patches]);
  useEffect(()=>{if(!activeViews.some(v=>v.id===activeView))setActiveView('front');},[productId,catalog.products]);
  useEffect(()=>{setProductSheetGroup(product?.product_type||'shirt');},[productId,catalog.products]);
  useEffect(()=>{Array.from(new Set(activeViews.map(v=>imageForView(v.id)).filter(Boolean))).forEach(src=>{const img=new Image();img.decoding='async';img.src=src;});},[productId,catalog.products]);
  useEffect(()=>{setStageZoom({scale:1,x:0,y:0});setTrashActive(false);setTrashHot(false);pinch.current=null;drag.current=null;pan.current=null;},[activeView,productId]);

  if(!catalogReady)return <main className="shell" style={{'--patchie-font':brand.fontFamily}}><header className="topbar"><a className="brand" href="/"><BrandIdentity brand={brand}/></a><div className="toplinks"><span>Sản phẩm base · Patch thêu ủi</span><a href="/admin">Quản trị ↗</a></div></header><section className="catalog-loading"><b>Đang tải sản phẩm base...</b><p>Patchie đang đồng bộ catalog mới nhất.</p></section></main>;
  if(!catalog.products.length)return <main className="shell" style={{'--patchie-font':brand.fontFamily}}><header className="topbar"><a className="brand" href="/"><BrandIdentity brand={brand}/></a><div className="toplinks"><span>Sản phẩm base · Patch thêu ủi</span><a href="/admin">Quản trị ↗</a></div></header><section className="catalog-loading"><b>Chưa có sản phẩm base</b><p>Vào admin để thêm sản phẩm hoặc màu variation trước nhé.</p></section></main>;

  function remember(){setHistory(a=>[...a.slice(-19),placed.map(x=>({...x}))]);setOrder(null);}
  function undo(){setHistory(a=>{const prev=a[a.length-1];if(!prev){show('Chưa có bước để hoàn tác.');return a;}setPlaced(prev.map(x=>({...x})));setOrder(null);return a.slice(0,-1);});}
  function confirmUndo(){if(!history.length)return show('Chưa có bước để hoàn tác.');if(activeView!=='front'&&!undoAsked){setUndoAsked(true);setUndoAsk(true);return;}undo();}
  function approveUndo(){setUndoAsk(false);undo();}
  function add(){if(!chosenPatch)return show('Chọn một patch trước nhé.');if(placed.length>=12)return show('Bố cục tối đa 12 patch.');remember();const uid=crypto.randomUUID();setSelectedUid(uid);setPlaced(a=>[...a,{uid,patchId:chosen,view:activeView,x:.5+Math.random()*.08,y:.38+Math.random()*.1,rotation:0}]);}
  function isOverTrash(e){if(!trash.current)return false;const r=trash.current.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;}
  function removeDraggedPatch(uid){setPlaced(a=>a.filter(x=>x.uid!==uid));if(selectedUid===uid)setSelectedUid('');}
  function move(e){if(!drag.current||!stage.current||pinch.current)return;const r=stage.current.getBoundingClientRect();const x=(e.clientX-r.left-stageZoom.x)/(r.width*stageZoom.scale),y=(e.clientY-r.top-stageZoom.y)/(r.height*stageZoom.scale);setTrashHot(isOverTrash(e));setOrder(null);setPlaced(a=>a.map(item=>item.uid===drag.current?{...item,x:Math.max(.08,Math.min(.92,x)),y:Math.max(.08,Math.min(.92,y))}:item));}
  function startDrag(e,uid){e.preventDefault();e.stopPropagation();setSelectedUid(uid);setTrashActive(true);setTrashHot(isOverTrash(e));remember();pan.current=null;drag.current=uid;e.currentTarget.setPointerCapture(e.pointerId);}
  function startPan(e){if(stageZoom.scale<=1||e.target.closest?.('.placed-patch'))return;e.preventDefault();setSelectedUid('');drag.current=null;pan.current={x:e.clientX,y:e.clientY,zoom:{...stageZoom}};e.currentTarget.setPointerCapture(e.pointerId);}
  function movePan(e){if(!pan.current||!stage.current||pinch.current)return;const r=stage.current.getBoundingClientRect(),start=pan.current;setStageZoom(containZoom({...start.zoom,x:start.zoom.x+e.clientX-start.x,y:start.zoom.y+e.clientY-start.y},r));}
  function moveStage(e){if(drag.current)move(e);else movePan(e);}
  function endStage(e){const uid=drag.current;if(uid&&e&&isOverTrash(e))removeDraggedPatch(uid);drag.current=null;pan.current=null;setTrashActive(false);setTrashHot(false);}
  function clearView(){if(!activePlaced.length)return show('Mặt này chưa có patch.');remember();setPlaced(a=>a.filter(x=>(x.view||'front')!==activeView));setSelectedUid('');}
  function changeProduct(id,opts={}){
    const next=catalog.products.find(p=>p.id===id);
    const keepCustom=opts.keepCustom&&next&&productBaseKey(next)===selectedBaseKey;
    setProductId(id);setActiveView('front');setFlowDone(false);setSelectedUid('');setOrder(null);
    if(!keepCustom){setPlaced([]);setHistory([]);setSize('');return;}
    if(size&&next?.sizes?.length&&!next.sizes.includes(size))setSize('');
  }
  function changeProductBase(key){
    const variants=catalog.products.filter(p=>productBaseKey(p)===key);
    const next=variants.find(p=>p.color===product?.color)||variants[0];
    if(next)changeProduct(next.id);
  }
  function changeProductColor(id){if(id!==productId)changeProduct(id,{keepCustom:true});}
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
    if(!isLastStep){setActiveView(activeViews[stepIndex+1].id);show(skipped?'Đã bỏ qua mặt này.':'Đã lưu bước này.');return;}
    setFlowDone(true);
    show('Xong các vị trí. Nhập thông tin để đặt đơn nhé.');
    setTimeout(()=>document.querySelector('.request')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }
  function finishCustom(){setFlowDone(true);setSelectedUid('');setCelebrate(true);show('Xong mockup. Nhập thông tin để đặt đơn nhé.');setTimeout(()=>setCelebrate(false),1100);setTimeout(()=>document.querySelector('.request')?.scrollIntoView({behavior:'smooth',block:'start'}),900);}
  function jumpView(id){setActiveView(id);setSelectedUid('');}
  function tapView(e,id){e.preventDefault();e.stopPropagation();jumpView(id);}

  async function makePNG(){
    const c=document.createElement('canvas');c.width=1200;c.height=1200;const ctx=c.getContext('2d');
    const draw=src=>new Promise((res,rej)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>res(im);im.onerror=rej;im.src=src;});
    ctx.fillStyle='#f8f6ef';ctx.fillRect(0,0,1200,1200);
    const cells=[{x:0,y:0},{x:600,y:0},{x:0,y:600},{x:600,y:600}];
    for(const [idx,view] of activeViews.entries()){
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
    if(!flowDone)throw Error('Hoàn tất các mặt custom trước nhé.');
    if(!placed.length)throw Error('Thêm ít nhất một patch trước nhé.');
    if(!name.trim())throw Error('Nhập tên để shop nhận diện yêu cầu.');
    if(!phone.trim())throw Error('Nhập số điện thoại để shop liên hệ.');
    if(!address.trim())throw Error('Nhập địa chỉ nhận hàng.');
    if(!size)throw Error('Chọn size trước nhé.');
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
    return `Chào Patchie! Mình muốn đặt sản phẩm custom.\nMã đơn: ${id}\nTên: ${name.trim()}\nSĐT: ${phone.trim()}\nĐịa chỉ nhận hàng: ${address.trim()}\nCách hoàn thiện: ${mode==='shop'?'Shop ủi giúp':'Tự ủi tại nhà'}\nBase: ${product?.name||'Sản phẩm base'} · ${product?.color||''}\nGiá base: ${money(product?.price)}\nSize: ${size}\nPatch:\n${lines}\nTổng tạm tính: ${money(orderTotal)}\nGhi chú: ${note||'Không có'}`;
  }

  async function placeOrder(){setBusy(true);try{const {id}=await save();setOrder({id,message:orderMessage(id)});show(`Đã tạo mã đơn ${id}.`);}catch(e){show(e.message);}finally{setBusy(false);}}
  async function copyOrder(){if(!order)return;try{await navigator.clipboard.writeText(order.message);show('Đã copy nội dung đơn.');}catch{show('Không copy được, bạn copy thủ công giúp mình nhé.');}}
  async function openMessenger(){if(!order)return;await copyOrder();if(catalog.settings.messengerUrl)window.open(catalog.settings.messengerUrl,'_blank','noopener,noreferrer');else show('Shop chưa cài link Messenger trong admin.');}
  const MiniPreview=()=> <div className="order-preview"><div className="order-preview-title"><b>Preview mockup</b><span>{placed.length} patch</span></div><div className="order-preview-grid">{activeViews.map(v=>{const shirt=(product?.view_images||{})[v.id]||(product?.view_images||{}).front||product?.image_url||defaultProduct.image_url,inView=placed.filter(x=>(x.view||'front')===v.id);return <div className="order-preview-tile" key={v.id}><img src={shirt} alt={v.label}/>{inView.map((item,i)=>{const p=catalog.patches.find(x=>x.id===item.patchId),s=patchSizePercent(p,v.id);return p?<span key={item.uid} className="mini-placed" style={{left:`${item.x*100}%`,top:`${item.y*100}%`,width:`${s.width}%`,height:`${s.height}%`,zIndex:i+1,transform:`translate(-50%,-50%) rotate(${normalizeRotation(item.rotation)}deg)`}}><img src={p.image_url} alt={p.name}/></span>:null})}<em>{v.short}</em></div>})}</div></div>;
  const productThumb=p=>(p?.view_images||{}).front||p?.image_url||defaultProduct.image_url;
  const productsByGroup=type=>catalog.products.filter(p=>(p.product_type||'shirt')===type);
  const productBasesByGroup=type=>Array.from(productsByGroup(type).reduce((map,p)=>{const key=productBaseKey(p);map.set(key,[...(map.get(key)||[]),p]);return map;},new Map()).entries()).map(([key,list])=>{const current=list.find(p=>p.id===productId)||list[0],prices=list.map(p=>Number(p.price)).filter(Number.isFinite);return {value:key,label:current.name,sub:`${list.length} màu`,price:prices.length?`từ ${money(Math.min(...prices))}`:'Chưa set',image:productThumb(current)};});
  const productGroupOptions=PRODUCT_GROUPS.filter(g=>productsByGroup(g.value).length).map(g=>{const list=productsByGroup(g.value),first=list[0];return {value:g.value,label:g.label,sub:`${productBasesByGroup(g.value).length} mẫu`,image:brand.productGroupImages?.[g.value]||productThumb(first)};});
  const patchGroupOptions=patchGroups.map(g=>({value:g,label:g==='all'?'Tất cả':g,sub:`${patchGroupCount(g)} patch`}));
  const productOptions=productBasesByGroup(productSheetGroup);
  const selectData=selectSheet==='patchGroup'?{label:'Nhóm patch',intro:'Chọn nhóm patch muốn xem.',value:activePatchGroup,options:patchGroupOptions,onChange:setActivePatchGroup}:selectSheet==='productGroup'?{label:'Nhóm sản phẩm',intro:'Chọn loại base trước, rồi chọn mẫu cụ thể.',value:productSheetGroup,options:productGroupOptions,onChange:setProductSheetGroup,nextSheet:'product'}:selectSheet==='product'?{label:productGroupLabel(productSheetGroup),intro:'Chọn mẫu base muốn custom. Màu sẽ chọn ở bước kế bên.',value:selectedBaseKey,options:productOptions,onChange:changeProductBase,backSheet:'productGroup'}:null;
  const CuteSelect=({label,value,options,note,sheetKey,onOpen})=>{const current=options.find(o=>o.value===value)||options[0];return <div className="pretty-select-field"><span>{label}</span><button type="button" className={`pretty-select-button ${current?.image?'has-thumb':''}`} onClick={()=>{onOpen?.();setSelectSheet(sheetKey);}}>{current?.image&&<span className="select-thumb"><img src={current.image} alt=""/></span>}<span className="select-copy"><b>{current?.label||'Chọn'}</b>{current?.sub&&<small>{current.sub}</small>}</span>{current?.price&&<strong className="select-price">{current.price}</strong>}<i>⌄</i></button>{note&&<small className="field-note">{note}</small>}</div>};
  const PatchGroupSelect=()=> <CuteSelect label="Nhóm patch" value={activePatchGroup} sheetKey="patchGroup" options={patchGroupOptions}/>;
  const ProductSelect=({note=false})=> <div className="form-field product-select-field"><CuteSelect label="Sản phẩm base" value={selectedBaseKey} sheetKey="productGroup" onOpen={()=>setProductSheetGroup(product?.product_type||'shirt')} note={note?`Giá base: ${money(product?.price)}`:''} options={[{value:selectedBaseKey,label:product?.name||'Sản phẩm base',sub:product?.color||'',price:money(product?.price),image:productThumb(product)}]}/></div>;
  const ColorSelect=()=> <div className="form-field color-field"><label>Màu</label><div className="color-row">{colorVariants.map(v=><button type="button" key={v.id} className={`color-chip ${v.id===productId?'on':''}`} onClick={()=>changeProductColor(v.id)} title={`${v.color||'Màu'} ${v.hex||''}`}><span className="color-swatch" style={{backgroundColor:v.hex||'#f5f1e8'}}></span><b>{v.color}</b></button>)}</div></div>;

  return <main className="shell" style={{'--patchie-font':brand.fontFamily,'--step1-desktop':cssContent(brand.step1Desktop),'--step1-mobile':cssContent(brand.step1Mobile),'--step2-desktop':cssContent(brand.step2Desktop),'--step2-mobile':cssContent(brand.step2Mobile)}}><header className="topbar"><a className="brand" href="/"><BrandIdentity brand={brand}/></a><div className="toplinks"><span>{brand.slogan}</span><a href="/admin">Quản trị ↗</a></div></header>
    <section className="hero"><div><div className="eyebrow">{brand.heroEyebrow}</div><h1>{brand.heroTitle}<br/><em>{brand.heroAccent}</em></h1><p>{brand.heroDescription}</p></div></section>
    <div className="workspace"><aside className="panel picker"><div className="panel-title"><div><small>{brand.step1Label}</small><h2>{brand.step1Title}</h2></div><span className="counter">{placed.length}/12</span></div><p className="muted">Kích thước patch hiển thị theo số cm shop nhập trong admin.</p><PatchGroupSelect/><div className="patch-grid">{visiblePatches.map(p=><button key={p.id} className={`patch-card ${chosen===p.id?'picked':''}`} onClick={()=>choosePatch(p)}><span className="patch-img"><img src={p.image_url} alt={p.name}/></span>{quotePatch===p.id&&p.quote&&<span className="patch-bubble">{p.quote}</span>}<b>{p.name}</b><small>{patchLabel(p)}</small><strong className="price-tag">{money(p.price)}</strong></button>)}</div><button className="button dark full" onClick={add}>{brand.addPatchLabel}</button><div className="tip"><span>✦</span><p>Chọn mặt base ở khu mockup, rồi thêm patch. Mỗi vị trí sẽ được lưu theo mặt riêng.</p></div><hr/><ProductSelect note/><ColorSelect/><div className="form-field"><label>Size</label><div className="size-row">{sizes.map(s=><button type="button" key={s} className={`size ${size===s?'on':''}`} onClick={()=>setSize(s)}>{s}</button>)}</div></div></aside>
      <section className="preview-col"><div className="preview-head"><div><small>02 / SẮP XẾP</small><h2>{flowDone?'Xem lại mockup':'Bước '+(stepIndex+1)+' · '+viewName(activeView)}</h2></div><div className="editor-actions"><button onClick={confirmUndo} disabled={!history.length}>↶ Hoàn tác</button><button onClick={clearView}>Xóa mặt này</button></div></div><div className="mobile-patch-dock"><small className="mobile-dock-kicker">{brand.step1Mobile}</small><div className="mobile-dock-head"><b>Chọn patch trước</b><span>{visiblePatches.length}/{catalog.patches.length}</span></div><PatchGroupSelect/><div className="mobile-patch-strip">{visiblePatches.map(p=><button key={p.id} className={`patch-card ${chosen===p.id?'picked':''}`} onClick={()=>choosePatch(p)}><span className="patch-img"><img src={p.image_url} alt={p.name}/></span>{quotePatch===p.id&&p.quote&&<span className="patch-bubble">{p.quote}</span>}<b>{p.name}</b><small>{patchLabel(p)}</small><strong className="price-tag">{money(p.price)}</strong></button>)}</div><button className="button dark full" onClick={add}>＋ Thêm patch vào {viewName(activeView).toLowerCase()}</button></div><div className="view-tabs guided-tabs">{activeViews.map((v,i)=><button key={v.id} className={`${activeView===v.id?'active':''} ${i<stepIndex||flowDone?'done':''} ${v.id.includes('sleeve')?'sleeve-tab':''}`} onClick={()=>jumpView(v.id)}><span>{i+1}</span>{v.short}<small>{placed.filter(x=>(x.view||'front')===v.id).length}</small></button>)}</div><div className="preview-card"><div className={`stage product-${product?.product_type||"shirt"} ${stageZoom.scale>1?"is-zoomed":""}`} ref={stage} onPointerDown={startPan} onPointerMove={moveStage} onPointerUp={endStage} onPointerLeave={endStage} onTouchStart={startPinch} onTouchMove={movePinch} onTouchEnd={endPinch} onTouchCancel={endPinch}><div className="stage-zoom-layer" style={{transform:`translate(${stageZoom.x}px,${stageZoom.y}px) scale(${stageZoom.scale})`}}><img className="tee" src={activeImage} alt={`${product?.name||'Sản phẩm base'} - ${viewName(activeView)}`}/>{activePlaced.map((x,i)=>{const p=catalog.patches.find(y=>y.id===x.patchId);return <button key={x.uid} className={`placed-patch ${selectedUid===x.uid?'selected':''}`} aria-label={`Kéo patch ${p?.name}`} style={{left:`${x.x*100}%`,top:`${x.y*100}%`,zIndex:i+1,transform:`translate(-50%,-50%) rotate(${normalizeRotation(x.rotation)}deg)`,...patchPreviewStyle(p)}} onPointerDown={e=>startDrag(e,x.uid)}><img src={p?.image_url} alt={p?.name}/></button>})}</div>{activeView==='front'&&<div className="mobile-sleeve-hotspots"><button type="button" className="sleeve-hotspot sleeve-left" onPointerDown={e=>tapView(e,'right_sleeve')}><b>Tay phải</b><small>{placed.filter(x=>(x.view||'front')==='right_sleeve').length}</small></button><button type="button" className="sleeve-hotspot sleeve-right" onPointerDown={e=>tapView(e,'left_sleeve')}><b>Tay trái</b><small>{placed.filter(x=>(x.view||'front')==='left_sleeve').length}</small></button><button type="button" className="sleeve-hotspot back-hotspot" onPointerDown={e=>tapView(e,'back')}><b>↩ Mặt sau</b><small>{placed.filter(x=>(x.view||'front')==='back').length}</small></button></div>}{activeView!=='front'&&<div className="mobile-front-hotspot"><button type="button" onPointerDown={e=>tapView(e,'front')}>← Mặt trước</button></div>}<button type="button" className="undo-float" onPointerDown={e=>e.stopPropagation()} onClick={confirmUndo} disabled={!history.length} aria-label="Hoàn tác">↺</button><div ref={trash} className={`trash-zone ${trashActive||selectedItem?'is-active':''} ${trashHot?'is-hot':''}`} aria-hidden="true"><span>🗑</span><small>Thả để xoá</small></div>{!activePlaced.length&&<div className="empty-nudge">Thêm patch hoặc bỏ qua mặt này <span>↗</span></div>}{activePlaced.length>0&&stageZoom.scale===1&&<div className="pinch-nudge">Dùng 2 ngón để zoom, kéo nền để soi áo</div>}</div>{selectedItem&&<div className="rotate-panel rotate-panel-vertical" aria-label="Xoay patch"><input className="vertical-range" type="range" min="-180" max="180" value={-signedRotation(selectedItem.rotation)} onPointerDown={beginRotate} onPointerUp={endRotate} onTouchStart={beginRotate} onTouchEnd={endRotate} onChange={e=>rotateSelected(-Number(e.target.value))}/><b>{signedRotation(selectedItem.rotation)}°</b><small>{selectedPatch?.name}</small></div>}<div className="preview-foot"><span>{product?.name||'Mockup theo mẫu base'}</span><span>{viewName(activeView)}</span></div></div><div className="mobile-config"><ProductSelect/><ColorSelect/><div className="form-field"><label>Size</label><div className="size-row">{sizes.map(s=><button type="button" key={s} className={`size ${size===s?'on':''}`} onClick={()=>setSize(s)}>{s}</button>)}</div></div></div><button type="button" className="button dark finish-custom" onClick={finishCustom}>Đã custom xong rồi</button><div className="method-row"><button className={mode==='diy'?'method active':'method'} onClick={()=>setMode('diy')}><span>🏠</span><b>Tự ủi tại nhà</b><small>Nhận patch rời cùng base</small></button><button className={mode==='shop'?'method active':'method'} onClick={()=>setMode('shop')}><span>🪡</span><b>Shop ủi giúp</b><small>Gửi mã đơn, shop làm theo</small></button></div></section>
      <aside className={`panel request ${flowDone?'':'request-locked'}`}><div className="panel-title"><div><small>03 / ĐẶT ĐƠN</small><h2>Thông tin nhận hàng</h2></div><span className="spark">✳</span></div>{!flowDone?<div className="locked-note"><b>Hoàn tất mockup trước</b><p>Custom các vùng muốn custom cần dùng, sau đó bấm “Đã custom xong rồi” để nhập thông tin đặt đơn.</p></div>:<><p className="muted">Website không thanh toán. Bấm đặt đơn để lấy mã, copy rồi gửi Messenger cho shop.</p><MiniPreview/><div className="price-summary"><div><span>Sản phẩm base</span><b>{money(product?.price)}</b></div><div><span>Patch × {placed.length}</span><b>{money(patchTotal)}</b></div><div className="total"><span>Tổng tạm tính</span><b>{money(orderTotal)}</b></div></div><div className="form-field"><label>Tên của bạn</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Tên người nhận" maxLength={80}/></div><div className="form-field"><label>Số điện thoại</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="SĐT để shop liên hệ" inputMode="tel" maxLength={30}/></div><div className="form-field"><label>Địa chỉ nhận hàng</label><textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" rows={3} maxLength={500}/></div><div className="form-field"><label>Ghi chú <span>(không bắt buộc)</span></label><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Màu base, yêu cầu thêm…" rows={3} maxLength={1200}/></div><label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>{catalog.settings.privacyText}</span></label><button className="button coral full send-button" onClick={placeOrder} disabled={busy}>{busy?'Đang tạo mã…':'Đặt đơn'}</button>{order&&<div className="order-code-card"><span>Mã đơn của bạn</span><div className="order-code-row"><b>{order.id}</b><button type="button" onClick={copyOrder}>Copy</button><button type="button" className="messenger-btn" onClick={openMessenger}>m</button></div><small>Copy mã đơn hoặc bấm Messenger để gửi nội dung cho shop.</small></div>}<div className="tiny-note">Shop sẽ xem mockup các mặt trong admin và xác nhận trước khi chốt.</div></>}</aside></div>
    <footer><span>Patchie · Customize your everyday</span><span>Chọn patch · Tạo mã đơn · Gửi shop</span></footer>{undoAsk&&<div className="cute-modal" role="dialog" aria-modal="true" aria-label="Xác nhận hoàn tác"><div className="cute-card"><span className="cute-spark">↺</span><h3>Bạn có muốn hoàn tác?</h3><p>Bước vừa rồi sẽ được lùi lại. Hỏi một lần thôi, lần sau bấm là hoàn tác liền.</p><div><button type="button" className="cute-secondary" onClick={()=>setUndoAsk(false)}>Giữ lại</button><button type="button" className="cute-primary" onClick={approveUndo}>Hoàn tác</button></div></div></div>}{selectData&&<div className="cute-modal select-modal" role="dialog" aria-modal="true" aria-label={`Chọn ${selectData.label}`} onClick={()=>setSelectSheet(null)}><div className="cute-card select-card" onClick={e=>e.stopPropagation()}><span className="cute-spark">⌄</span><h3>{selectData.label}</h3><p>{selectData.intro||'Chọn một lựa chọn bên dưới nhé.'}</p>{selectData.backSheet&&<button type="button" className="select-back" onClick={()=>setSelectSheet(selectData.backSheet)}>← Đổi nhóm sản phẩm</button>}<div className="select-options">{selectData.options.map(o=><button type="button" key={o.value} className={o.value===selectData.value?'selected':''} onClick={()=>{selectData.onChange(o.value);setSelectSheet(selectData.nextSheet||null);}}>{o.image&&<span className="select-option-thumb"><img src={o.image} alt=""/></span>}<span><b>{o.label}</b>{o.sub&&<small>{o.sub}</small>}</span>{o.price&&<strong className="select-price">{o.price}</strong>}<i>{o.value===selectData.value?'✓':''}</i></button>)}</div>{!selectData.options.length&&<p className="empty-select">Nhóm này chưa có sản phẩm.</p>}<button type="button" className="cute-secondary select-close" onClick={()=>setSelectSheet(null)}>Đóng</button></div></div>}{celebrate&&<div className="confetti-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>}{toast&&<div className="toast">{toast}</div>}</main>;
}
