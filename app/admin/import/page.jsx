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

export default function PatchImportPage() {
  const [user, setUser] = useState(null), [csv, setCsv] = useState(null), [images, setImages] = useState(null), [rows, setRows] = useState([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { const client = supa(); client.auth.getUser().then(({ data }) => setUser(data.user)); const { data: listener } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user || null)); return () => listener.subscription.unsubscribe(); }, []);
  async function preview(file) {
    setCsv(file); setMessage('');
    try {
      const result = parseCsv(await file.text());
      if (!result.length) throw new Error('File không có dòng dữ liệu.');
      setRows(result);
    } catch (error) { setRows([]); setMessage(error.message); }
  }
  async function importRows() {
    if (!csv || !rows.length) return;
    if (!images) return setMessage('Chọn thư mục chứa ảnh patch trước.');
    setBusy(true); setMessage('Đang tải ảnh và nhập patch…');
    try {
      const files = new Map(Array.from(images).map(file => [file.name, file]));
      const missingFiles = rows.map((row, index) => ({ name: String(row.image_filename || row.image_file || '').trim(), line: index + 2, url: String(row.image_url || '').trim() })).filter(item => !item.url && (!item.name || !files.has(item.name)));
      if (missingFiles.length) throw new Error(missingFiles.map(item => `Không tìm thấy ảnh “${item.name || '(thiếu image_filename)'}” (dòng ${item.line}).`).join('\n'));
      const prepared = [];
      for (const [index, row] of rows.entries()) {
        let image_url = String(row.image_url || '').trim();
        const fileName = String(row.image_filename || row.image_file || '').trim();
        if (!image_url && fileName) {
          const file = files.get(fileName);
          if (!file) throw new Error(`Không tìm thấy ảnh “${fileName}” (dòng ${index + 2}).`);
          const form = new FormData(); form.append('file', file);
          const upload = await fetch('/api/admin/patch-import', { method: 'POST', body: form });
          const result = await upload.json();
          if (!upload.ok) throw new Error(result.error || `Không tải được ${fileName}.`);
          image_url = result.image_url;
        }
        prepared.push({ ...row, image_url });
      }
      const response = await fetch('/api/admin/patch-import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: prepared }) });
      const result = await response.json();
      if (!response.ok) throw new Error([result.error, ...(result.details || [])].filter(Boolean).join('\n'));
      setMessage(`Đã nhập ${result.count} patch. Nếu patch đã tồn tại cùng ID, thông tin của patch đó được cập nhật.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  if (!user) return <main style={{ maxWidth: 720, margin: '12vh auto', padding: 24, fontFamily: 'Arial,sans-serif' }}><h1>Đăng nhập admin trước</h1><p>Vào <a href="/admin">/admin</a> để đăng nhập, sau đó mở lại trang import.</p></main>;
  return <main style={{ maxWidth: 900, margin: '40px auto', padding: 24, fontFamily: 'Arial,sans-serif', color: '#25231f' }}>
    <a href="/admin">← Quay lại admin</a><h1>Bulk import patch</h1>
    <p>Chọn file CSV xuất từ Excel/Google Sheets và chọn toàn bộ ảnh patch. Ảnh sẽ được lưu trong bucket <code>patch-assets</code>, thư mục <code>Patch Bulk Upload</code>. Ảnh nên là PNG, JPG hoặc WebP, tối đa 4 MB mỗi ảnh.</p>
    <ol><li>Trong Excel, lưu sheet thành CSV UTF-8. Cột <code>image_filename</code> ghi đúng tên ảnh trong thư mục.</li><li>Chọn CSV và thư mục ảnh bên dưới.</li><li>Kiểm tra số dòng rồi bấm import. ID trùng sẽ cập nhật patch cũ.</li></ol>
    <p><b>Cột bắt buộc:</b> <code>id, name, image_filename, width_cm, height_cm</code>. Tuỳ chọn: <code>price, quote, patch_groups, tags, recommended_patch_ids, release_status, active, sort_order</code>. Các cột danh sách ngăn cách bằng dấu chấm phẩy.</p>
    <label style={{ display: 'block', margin: '20px 0' }}>File CSV<br/><input type="file" accept=".csv,text/csv" onChange={event => event.target.files?.[0] && preview(event.target.files[0])}/></label>
    <label style={{ display: 'block', margin: '20px 0' }}>Ảnh patch<br/><input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={event => setImages(event.target.files)}/></label>
    {rows.length > 0 && <p>Đã đọc {rows.length} dòng patch từ <b>{csv?.name}</b>.</p>}
    <button disabled={busy || !rows.length} onClick={importRows} style={{ padding: '12px 18px', border: 0, borderRadius: 8, background: '#25231f', color: 'white', cursor: 'pointer' }}>{busy ? 'Đang nhập…' : 'Tải ảnh và import patch'}</button>
    {message && <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f1eb', padding: 16, borderRadius: 8, marginTop: 20 }}>{message}</pre>}
  </main>;
}
