'use client';
import {useEffect, useState} from 'react';
import {SOCIAL_DEFAULTS} from '@/lib/social-sharing';
import './social-sharing.css';
async function request(url, options) {
  const response = await fetch(url, options); const data = await response.json();
  if (!response.ok) throw new Error([401,403].includes(response.status) ? 'Bạn cần đăng nhập bằng tài khoản admin.' : data.error || 'Không thực hiện được. Thử lại nhé.');
  return data;
}
export default function SocialSharingAdmin() {
  const [form,setForm] = useState(SOCIAL_DEFAULTS), [loading,setLoading] = useState(true), [failed,setFailed] = useState(false), [busy,setBusy] = useState(false), [message,setMessage] = useState(''), [dirty,setDirty] = useState(false);
  useEffect(() => { let live = true; request('/api/admin/social-sharing').then(value => {if(live)setForm(value);}).catch(error => {if(live){setMessage(error.message);setFailed(true);}}).finally(() => {if(live)setLoading(false);}); return () => {live=false;}; }, []);
  const change = (key,value) => {setForm(current => ({...current,[key]:value}));setDirty(true);setMessage('');};
  async function upload(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 4*1024*1024) {setMessage('Chọn JPG, PNG hoặc WebP tối đa 4 MB.');return;}
    setBusy(true);setMessage('');
    try { const body = new FormData();body.append('file',file);const data = await request('/api/admin/upload',{method:'POST',body});change('image',data.image_url);setMessage('Đã tải ảnh. Bấm Lưu nội dung chia sẻ để áp dụng.'); }
    catch(error){setMessage(error.message);} finally {setBusy(false);}
  }
  async function save(event) {
    event.preventDefault();setBusy(true);setMessage('');
    try {const data = await request('/api/admin/social-sharing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});setForm(data.value);setDirty(false);setMessage('Đã lưu nội dung chia sẻ. Facebook/Zalo có thể vẫn giữ preview cũ trong cache.');}
    catch(error){setMessage(error.message);}finally{setBusy(false);}
  }
  return <main className="admin-shell social-admin"><header><small>PATCHIE · THIẾT LẬP</small><h1>Chia sẻ link</h1><p>Chọn lời chào và hình ảnh khi khách gửi link website cho bạn bè.</p></header>
    {message && <p role="status" className="admin-msg">{message}{failed && <> <a href="/admin">Đăng nhập admin →</a></>}</p>}
    {loading ? <p>Đang tải cài đặt…</p> : !failed && <div className="social-grid"><form className="admin-card" onSubmit={save}><fieldset disabled={busy}>
      <label>Tiêu đề<input required maxLength={100} value={form.title} onChange={e=>change('title',e.target.value)}/><small>{form.title.length}/100 · Nên viết ngắn để dễ đọc.</small></label>
      <label>Mô tả<textarea required maxLength={300} rows={4} value={form.description} onChange={e=>change('description',e.target.value)}/><small>{form.description.length}/300</small></label>
      <label>Ảnh chia sẻ<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/><small>Khuyến nghị 1200 × 630 px. JPG, PNG hoặc WebP, tối đa 4 MB. Đặt chữ và logo cách mép ảnh để hạn chế bị cắt.</small></label>
      {form.image && <button type="button" className="button light" onClick={()=>change('image','')}>Bỏ ảnh chia sẻ</button>}
      <button className="button dark" type="submit">{busy?'Đang xử lý…':'Lưu nội dung chia sẻ'}</button>{dirty && <small>Bạn có thay đổi chưa lưu.</small>}
    </fieldset></form><section className="social-preview-wrap"><h2>Xem trước</h2><article className="social-preview">{form.image ? <img src={form.image} alt="Ảnh xem trước khi chia sẻ link"/> : <div className="social-placeholder">Thêm một chút Patchie vào link ✦</div>}<div><small>WWW.PATCHIE.STORE</small><h3>{form.title}</h3><p>{form.description}</p></div></article><p className="admin-help">Đây là mô phỏng. Facebook và Zalo có thể cắt ảnh, rút gọn chữ theo vị trí hiển thị.</p><p className="admin-help">Áp dụng cho nội dung chia sẻ mặc định của website. Trang có metadata riêng vẫn giữ nội dung riêng. Ảnh chia sẻ không thay ảnh mockup hoặc logo trên trang.</p></section></div>}
  </main>;
}
