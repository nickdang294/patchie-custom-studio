'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

function supa() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
function parseCsv(source) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  const headers = (rows.shift() || []).map((value, index) => value.trim().replace(index === 0 ? /^\uFEFF/ : /$^/, ''));
  return rows.filter(values => values.some(value => value.trim())).map(values => Object.fromEntries(headers.map((header, i) => [header, values[i] || ''])));
}
const EDIT_FIELDS = ['name','image_filename','image_url','width_cm','height_cm','price','quote','patch_group','patch_groups','tags','recommended_patch_ids','release_status','stock_quantity','sold_count','is_featured','is_new','active','sort_order'];

export default function PatchImportPage() {
  const [user, setUser] = useState(null), [mode, setMode] = useState('create'), [csv, setCsv] = useState(null), [images, setImages] = useState(null), [rows, setRows] = useState([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { const client = supa(); client.auth.getUser().then(({ data }) => setUser(data.user)); const { data: listener } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user || null)); return () => listener.subscription.unsubscribe(); }, []);
  async function preview(file) {
    setCsv(file); setMessage('');
    try {
      const result = parseCsv(await file.text());
      if (!result.length) throw new Error('File không có dòng dữ liệu.');
      const headers = Object.keys(result[0]);
      const required = mode === 'edit' ? ['id'] : ['id','name','width_cm','height_cm'];
      const missing = required.filter(key => !headers.includes(key));
      if (missing.length) throw new Error(`Thiếu cột bắt buộc: ${missing.join(', ')}.`);
      if (mode === 'edit') {
        const unknown = headers.filter(key => key && key !== 'id' && !EDIT_FIELDS.includes(key));
        if (unknown.length) throw new Error(`Cột không được hỗ trợ: ${unknown.join(', ')}. ID chỉ dùng để xác định patch, không được đổi.`);
        const ids = result.map(row => String(row.id || '').trim());
        if (ids.some(id => !id)) throw new Error('Mỗi dòng cập nhật cần có ID patch.');
        if (new Set(ids).size !== ids.length) throw new Error('File có ID bị lặp; hãy giữ mỗi patch một dòng.');
      }
      setRows(result);
    } catch (error) { setRows([]); setMessage(error.message); }
  }
  async function uploadImagesAndPrepare() {
    const files = new Map(Array.from(images || []).map(file => [file.name, file]));
    const prepared = [];
    for (const [index, row] of rows.entries()) {
      let image_url = String(row.image_url || '').trim();
      const fileName = String(row.image_filename || row.image_file || '').trim();
      if (fileName) {
        const file = files.get(fileName);
        if (!file) throw new Error(`Không tìm thấy ảnh “${fileName}” (dòng ${index + 2}).`);
        const form = new FormData(); form.append('file', file);
        const upload = await fetch('/api/admin/patch-import', { method: 'POST', body: form });
        const result = await upload.json();
        if (!upload.ok) throw new Error(result.error || `Không tải được ${fileName}.`);
        image_url = result.image_url;
      }
      prepared.push({ ...row, ...(image_url ? { image_url } : {}) });
    }
    return prepared;
  }
  async function runImport() {
    if (!csv || !rows.length) return;
    setBusy(true); setMessage(mode === 'edit' ? 'Đang kiểm tra ID và dữ liệu cần cập nhật…' : 'Đang tải ảnh và nhập patch…');
    try {
      if (mode === 'edit') {
        const check = await fetch('/api/admin/patch-import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'validate-update', items: rows }) });
        const checkResult = await check.json();
        if (!check.ok) throw new Error([checkResult.error, ...(checkResult.details || [])].filter(Boolean).join('\n'));
      }
      const prepared = await uploadImagesAndPrepare();
      const response = await fetch('/api/admin/patch-import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: mode === 'edit' ? 'update' : 'create', items: prepared }) });
      const result = await response.json();
      if (!response.ok) throw new Error([result.error, ...(result.details || [])].filter(Boolean).join('\n'));
      setMessage(mode === 'edit' ? `Đã cập nhật ${result.count} patch theo ID. Các ô để trống được giữ nguyên; ảnh thay mới đã lưu trong Patch Bulk Upload.` : `Đã thêm ${result.count} patch mới.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  if (!user) return <main style={{ maxWidth: 720, margin: '12vh auto', padding: 24, fontFamily: 'Arial,sans-serif' }}><h1>Đăng nhập admin trước</h1><p>Vào <a href="/admin">/admin</a> để đăng nhập, sau đó mở lại trang import.</p></main>;
  const modeButton = (value, label) => <button type="button" onClick={() => { setMode(value); setCsv(null); setRows([]); setImages(null); setMessage(''); }} style={{ padding: '10px 16px', border: '1px solid #ddd5e8', borderRadius: 10, background: mode === value ? '#eee8fb' : '#fffefa', color: '#392f4d', fontWeight: 800, cursor: 'pointer' }}>{label}</button>;
  return <main style={{ maxWidth: 900, margin: '40px auto', padding: 24, fontFamily: 'Arial,sans-serif', color: '#25231f' }}>
    <a href="/admin">← Quay lại admin</a><h1>Bulk patch</h1>
    <div style={{ display: 'flex', gap: 8, margin: '18px 0' }}>{modeButton('create', 'Thêm patch mới')}{modeButton('edit', 'Cập nhật patch theo ID')}</div>
    {mode === 'edit' && <p><a href="/patch-edit-template.csv" download style={{ color: '#625281', fontWeight: 800 }}>Tải CSV mẫu cập nhật patch ↓</a></p>}
    {mode === 'create' ? <><p>Thêm patch mới bằng CSV và ảnh. Ảnh sẽ lưu trong bucket <code>patch-assets</code>, thư mục <code>Patch Bulk Upload</code>. PNG, JPG hoặc WebP, tối đa 4 MB mỗi ảnh.</p><p><b>Cột bắt buộc:</b> <code>id, name, width_cm, height_cm</code> và một trong <code>image_filename</code> / <code>image_url</code>. Các cột khác: <code>price, quote, patch_groups, tags, recommended_patch_ids, release_status, stock_quantity, sold_count, is_featured, is_new, active, sort_order</code>.</p></> : <><p>Cập nhật patch hiện có bằng ID. Chỉ những cột có trong CSV mới được cập nhật; ô trống giữ nguyên dữ liệu cũ. ID không được đổi. Nếu cần thay ảnh, điền <code>image_filename</code> kèm tên file ảnh hoặc điền <code>image_url</code>.</p><p><b>Các cột được cập nhật:</b> <code>id, name, image_filename, image_url, width_cm, height_cm, price, quote, patch_group, patch_groups, tags, recommended_patch_ids, release_status, stock_quantity, sold_count, is_featured, is_new, active, sort_order</code>. Danh sách ngăn cách bằng dấu chấm phẩy. Với giá, quote, tags hoặc danh sách gợi ý, dùng <code>__CLEAR__</code> để xóa giá trị; patch group sẽ về Best Seller.</p></>}
    <label style={{ display: 'block', margin: '20px 0' }}>File CSV<br/><input type="file" accept=".csv,text/csv" onChange={event => event.target.files?.[0] && preview(event.target.files[0])}/></label>
    <label style={{ display: 'block', margin: '20px 0' }}>Ảnh patch {mode === 'edit' && '(không bắt buộc nếu không thay ảnh)'}<br/><input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={event => setImages(event.target.files)}/></label>
    {rows.length > 0 && <><p>Đã đọc <b>{rows.length}</b> dòng từ <b>{csv?.name}</b>. {mode === 'edit' && 'Sẽ cập nhật các trường đã điền.'}</p><div style={{ overflowX: 'auto', maxHeight: 260, border: '1px solid #eee7dd', borderRadius: 9 }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}><thead><tr>{Object.keys(rows[0]).map(key => <th key={key} style={{ position: 'sticky', top: 0, background: '#f4f1eb', padding: 8, textAlign: 'left' }}>{key}</th>)}</tr></thead><tbody>{rows.slice(0, 12).map((row, index) => <tr key={index}>{Object.keys(rows[0]).map(key => <td key={key} style={{ borderTop: '1px solid #eee7dd', padding: 8 }}>{row[key]}</td>)}</tr>)}</tbody></table></div>{rows.length > 12 && <small>Đang hiển thị 12 dòng đầu trong preview.</small>}</>}
    <button disabled={busy || !rows.length} onClick={runImport} style={{ display: 'block', marginTop: 20, padding: '12px 18px', border: 0, borderRadius: 8, background: '#25231f', color: 'white', cursor: 'pointer', opacity: busy || !rows.length ? .55 : 1 }}>{busy ? 'Đang xử lý…' : mode === 'edit' ? 'Cập nhật patch theo ID' : 'Tải ảnh và thêm patch'}</button>
    {message && <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f1eb', padding: 16, borderRadius: 8, marginTop: 20 }}>{message}</pre>}
  </main>;
}
