'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ProductDesignAdmin() {
  const [products, setProducts] = useState([]), [patches, setPatches] = useState([]), [items, setItems] = useState([]);
  const [productId, setProductId] = useState(''), [name, setName] = useState(''), [minMatches, setMinMatches] = useState(1), [priority, setPriority] = useState(0), [view, setView] = useState('front'), [placements, setPlacements] = useState([]), [msg, setMsg] = useState('');
  const [dragId, setDragId] = useState(''), [editingId, setEditingId] = useState(''), [editingCreatedAt, setEditingCreatedAt] = useState('');
  const product = products.find(p => p.id === productId);
  const views = useMemo(() => product?.product_type === 'bag' ? [['front','Mặt trước'],['back','Mặt sau']] : [['front','Mặt trước'],['left_sleeve','Tay áo trái'],['right_sleeve','Tay áo phải'],['back','Mặt sau']], [product]);
  const image = view === 'front' ? (product?.view_images?.front || product?.image_url) : (product?.view_images?.[view] || '');
  const patchStyle = patch => { const refW=Number(product?.reference_width_cm)>0?Number(product.reference_width_cm):62.5, refH=Number(product?.reference_height_cm)>0?Number(product.reference_height_cm):62.5, fitW=Number(product?.image_fit_percent)>0?Number(product.image_fit_percent)/100:1, rawFitH=Number(product?.image_fit_height_percent), fitH=rawFitH>0?rawFitH/100:fitW; return {width:`${Math.max(.1,Math.min(100,Number(patch?.width_cm||4)/refW*fitW*100))}%`,height:`${Math.max(.1,Math.min(100,Number(patch?.height_cm||4)/refH*fitH*100))}%`}; };
  const refresh = async () => {
    const [productsResponse, patchesResponse, designsResponse] = await Promise.all([fetch('/api/admin/products'), fetch('/api/admin/patches'), fetch('/api/admin/product-designs')]);
    const [p, pa, d] = await Promise.all([productsResponse.json(), patchesResponse.json(), designsResponse.json()]);
    setProducts((p.items || []).filter(x => x.active !== false)); setPatches((pa.items || []).filter(x => x.active !== false && x.release_status !== 'coming_soon')); setItems(d.items || []);
  };
  useEffect(() => { refresh().catch(e => setMsg(e.message)); }, []);
  useEffect(() => { if (views.length && !views.some(x => x[0] === view)) setView('front'); }, [views, view]);
  const patchById = id => patches.find(p => p.id === id);
  function addPatch(id) {
    if (placements.length >= 12) return setMsg('Tối đa 12 patch trong một mẫu.');
    setPlacements(a => [...a, { uid: crypto.randomUUID(), patch_id: id, view, x: .5, y: .45, rotation: 0 }]);
  }
  function movePlacement(e, uid) {
    if (!dragId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPlacements(a => a.map(item => item.uid === uid ? { ...item, x: Math.max(.02, Math.min(.98, (e.clientX - rect.left) / rect.width)), y: Math.max(.02, Math.min(.98, (e.clientY - rect.top) / rect.height)) } : item));
  }
  async function save(e) {
    e.preventDefault();
    if (!product || !product.image_url || !product.view_images) return setMsg('Base cần có ảnh và cấu hình mặt trước.');
    if (!placements.length) return setMsg('Thêm ít nhất một patch.');
    if (Number(minMatches) > new Set(placements.map(p => p.patch_id)).size) return setMsg('Ngưỡng trùng không thể lớn hơn số patch khác nhau trong mẫu.');
    setMsg('Đang tạo thumbnail và lưu mẫu…');
    try {
      const response = await fetch('/api/admin/product-designs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: editingId || undefined, created_at: editingCreatedAt || undefined, name, product_id: productId, placements: placements.map(({ patch_id, view, x, y, rotation }) => ({ patch_id, view, x, y, rotation })), min_matches: Number(minMatches), priority: Number(priority) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Không lưu được mẫu.');
      setItems(a => [data.item, ...a.filter(x => x.id !== data.item.id)]); setName(''); setPlacements([]); setEditingId(''); setEditingCreatedAt(''); setMsg('Đã lưu mẫu phối.');
    } catch (error) { setMsg(error.message); }
  }
  function edit(item) { setEditingId(item.id); setEditingCreatedAt(item.created_at); setName(item.name); setProductId(item.product_id); setPlacements(item.placements.map(p => ({ ...p, uid: crypto.randomUUID() }))); setMinMatches(item.min_matches); setPriority(item.priority || 0); setView('front'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  async function remove(id) { if (!confirm('Xóa mẫu phối này và thumbnail?')) return; const response = await fetch(`/api/admin/product-designs?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); const data = await response.json(); if (!response.ok) return setMsg(data.error); setItems(a => a.filter(x => x.id !== id)); }
  async function toggle(item) { const response = await fetch('/api/admin/product-designs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...item, active: !item.active }) }); const data = await response.json(); if (!response.ok) return setMsg(data.error); setItems(a => a.map(x => x.id === item.id ? data.item : x)); }
  return <main className="admin-shell">
    <header className="admin-top"><a className="brand" href="/admin">← Patchie Admin</a><a href="/">Mở Studio ↗</a></header>
    <div className="admin-heading" style={{marginTop:24}}><div><small>PATCHIE STUDIO</small><h1>Mẫu phối sẵn</h1></div></div>
    {msg && <div className="admin-msg">{msg}</div>}
    <form className="admin-card" onSubmit={save} style={{display:'grid',gap:14}}>
      <h2>{editingId ? 'Sửa mẫu phối' : 'Tạo mẫu phối'}</h2>
      <div className="settings-form">
        <label>Tên mẫu<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ví dụ: Daily mood"/></label>
        <label>Sản phẩm base<select required value={productId} onChange={e=>{setProductId(e.target.value);setPlacements([]);}}><option value="">Chọn đúng biến thể / màu</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.color||p.sku||p.id}</option>)}</select></label>
        <label>Patch trùng tối thiểu<input type="number" min="1" max="12" value={minMatches} onChange={e=>setMinMatches(e.target.value)}/><small className="admin-help">Mẫu chỉ hiện khi khách đã chọn ít nhất số patch này.</small></label>
        <label>Ưu tiên khi số patch trùng bằng nhau<input type="number" value={priority} onChange={e=>setPriority(e.target.value)}/></label>
      </div>
      {product && <>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{views.map(([id,label])=><button type="button" className="button light" key={id} onClick={()=>setView(id)} aria-pressed={view===id}>{label}</button>)}</div>
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(220px,300px)',gap:16,alignItems:'start'}}>
          <div onPointerMove={e=>dragId&&movePlacement(e,dragId)} onPointerUp={()=>setDragId('')} style={{position:'relative',width:'100%',maxWidth:560,aspectRatio:'1/1',overflow:'hidden',background:'#f5f1e8',borderRadius:14,touchAction:'none'}}>
            {image ? <img src={image} alt="Base preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <p>Base chưa có ảnh cho mặt này.</p>}
            {placements.filter(p=>p.view===view).map(item=>{const patch=patchById(item.patch_id);return <img key={item.uid} src={patch?.image_url} alt={patch?.name} onPointerDown={e=>{e.preventDefault();setDragId(item.uid);e.currentTarget.setPointerCapture(e.pointerId);}} style={{position:'absolute',left:`${item.x*100}%`,top:`${item.y*100}%`,...patchStyle(patch),objectFit:'contain',transform:`translate(-50%,-50%) rotate(${item.rotation}deg)`,cursor:'grab',touchAction:'none'}}/>})}
          </div>
          <div style={{display:'grid',gap:8,maxHeight:560,overflow:'auto'}}><b>Thêm patch · {placements.length}/12</b>{patches.map(p=><button key={p.id} type="button" onClick={()=>addPatch(p.id)} style={{display:'flex',alignItems:'center',gap:8,padding:7,border:'1px solid #e8e2ee',borderRadius:9,background:'white',textAlign:'left'}}><img src={p.thumbnail_url||p.image_url} alt="" style={{width:38,height:38,objectFit:'contain'}}/><span>{p.name}</span><span style={{marginLeft:'auto'}}>＋</span></button>)}</div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{placements.map((p,i)=><span key={p.uid} style={{padding:'5px 8px',background:'#f0eaff',borderRadius:8,fontSize:11}}>{patchById(p.patch_id)?.name} · {views.find(v=>v[0]===p.view)?.[1]} <button type="button" onClick={()=>setPlacements(a=>a.filter(x=>x.uid!==p.uid))}>×</button></span>)}</div>
        <p className="admin-help">Kéo patch để đặt vị trí. Thumbnail ưu tiên mặt trước; nếu chưa có thì dùng mặt đầu tiên; dữ liệu lưu đủ vị trí cho từng mặt. Mẫu không lưu giá.</p>
        <button className="button dark">Lưu mẫu phối</button>
      </>}
    </form>
    <section className="admin-card"><h2>Mẫu đã lưu ({items.length})</h2><div className="patch-admin-grid">{items.map(item=><article className="admin-patch" key={item.id}><img src={item.thumbnail_url} alt={item.name}/><b>{item.name}</b><small>{products.find(p=>p.id===item.product_id)?.name || item.product_id}</small><small>Tối thiểu {item.min_matches} patch trùng</small><small>Tạo: {new Date(item.created_at).toLocaleDateString('vi-VN')} · Sửa: {new Date(item.updated_at).toLocaleDateString('vi-VN')}</small><label><input type="checkbox" checked={item.active} onChange={()=>toggle(item)}/> Đang bật</label><div style={{display:'flex',gap:6}}><button type="button" className="button light" onClick={()=>edit(item)}>Sửa</button><button type="button" className="delete-btn" onClick={()=>remove(item.id)}>Xóa</button></div></article>)}</div>{!items.length&&<p className="admin-help">Chưa có mẫu phối.</p>}</section>
  </main>;
}
