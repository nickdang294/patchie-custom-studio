'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

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

const parseTags = value => String(value || '').split(';').map(tag => tag.trim()).filter(Boolean);
const isTrue = value => /^(true|1|yes|on)$/i.test(String(value || '').trim());
const cardStyle = { background: '#fff', border: '1px solid #e9e3db', borderRadius: 16, padding: 22, marginTop: 18 };

export default function RecommendationRulesPage() {
  const [user, setUser] = useState(null), [authLoaded, setAuthLoaded] = useState(false);
  const [file, setFile] = useState(null), [rules, setRules] = useState([]), [errors, setErrors] = useState([]);
  const [savedCount, setSavedCount] = useState(null), [savedActiveCount, setSavedActiveCount] = useState(null);
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    client.auth.getUser().then(({ data }) => { setUser(data.user); setAuthLoaded(true); });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); setAuthLoaded(true); });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/recommendation-rules').then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không tải được quy tắc đã lưu.');
      const saved = result.rules || [];
      setSavedCount(saved.length);
      setSavedActiveCount(saved.filter(rule => rule.active !== false).length);
    }).catch(error => setMessage(error.message));
  }, [user]);

  async function preview(selected) {
    setFile(selected); setRules([]); setErrors([]); setMessage('');
    if (!selected) return;
    try {
      const rows = parseCsv(await selected.text());
      const required = ['rule_id', 'source_tags', 'target_tags', 'score', 'active'];
      const headers = (await selected.text()).split(/\r?\n/, 1)[0].replace(/^\uFEFF/, '').split(',').map(value => value.trim());
      const missing = required.filter(header => !headers.includes(header));
      if (missing.length) throw new Error(`Thiếu cột: ${missing.join(', ')}.`);
      const ids = new Set(), nextRules = [], nextErrors = [];
      rows.forEach((row, index) => {
        const line = index + 2, rule_id = String(row.rule_id || '').trim();
        const source_tags = parseTags(row.source_tags), target_tags = parseTags(row.target_tags);
        const score = Number(row.score), activeRaw = String(row.active || '').trim();
        if (!rule_id) nextErrors.push(`Dòng ${line}: thiếu rule_id.`);
        if (ids.has(rule_id)) nextErrors.push(`Dòng ${line}: rule_id “${rule_id}” bị trùng.`);
        ids.add(rule_id);
        if (!source_tags.length || !target_tags.length) nextErrors.push(`Dòng ${line}: source_tags và target_tags phải có ít nhất một tag.`);
        if (!Number.isFinite(score) || score <= 0 || score > 1000) nextErrors.push(`Dòng ${line}: score phải lớn hơn 0 và tối đa 1000.`);
        if (!/^(true|false|1|0|yes|no|on|off)$/i.test(activeRaw)) nextErrors.push(`Dòng ${line}: active phải là true hoặc false.`);
        nextRules.push({ rule_id, source_tags, target_tags, required_shared_prefix: String(row.required_shared_prefix || '').trim(), score, active: isTrue(activeRaw) });
      });
      setRules(nextRules); setErrors(nextErrors);
      setMessage(nextErrors.length ? `Đã đọc ${rows.length} quy tắc; sửa ${nextErrors.length} lỗi trước khi lưu.` : `Đã đọc ${rows.length} quy tắc từ ${selected.name}.`);
    } catch (error) { setErrors([error.message]); setMessage(error.message); }
  }

  async function saveRules() {
    if (!file || errors.length) return;
    setBusy(true); setMessage('Đang lưu bộ quy tắc…');
    try {
      const response = await fetch('/api/admin/recommendation-rules', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rules }) });
      const result = await response.json();
      if (!response.ok) throw new Error([result.error, ...(result.details || [])].filter(Boolean).join('\n'));
      setSavedCount(result.count); setSavedActiveCount(result.activeCount);
      setMessage(`Đã lưu ${result.count} quy tắc (${result.activeCount} đang bật). Quy tắc mới áp dụng ngay cho lượt gợi ý tiếp theo.`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  if (!authLoaded) return <main style={{ maxWidth: 900, margin: '50px auto', padding: 24, fontFamily: 'Arial,sans-serif' }}>Đang kiểm tra đăng nhập…</main>;
  if (!user) return <main style={{ maxWidth: 760, margin: '12vh auto', padding: 24, fontFamily: 'Arial,sans-serif' }}><h1>Đăng nhập admin trước</h1><p>Vào <a href="/admin">/admin</a> để đăng nhập, sau đó mở lại trang tải quy tắc.</p></main>;

  return <main style={{ maxWidth: 1000, margin: '36px auto', padding: 24, fontFamily: 'Arial,sans-serif', color: '#25231f' }}>
    <a href="/admin">← Quay lại dashboard</a>
    <header style={{ margin: '22px 0' }}><small>PATCHIE ADMIN</small><h1 style={{ margin: '6px 0' }}>Quy tắc gợi ý patch</h1><p>Tải bộ quy tắc riêng; việc này không import hoặc sửa sản phẩm patch.</p></header>
    <section style={cardStyle}>
      <h2 style={{ marginTop: 0 }}>Tải CSV quy tắc</h2>
      <p>Tải template, chỉnh các dòng quy tắc rồi upload lại. Tag trong file phải trùng chính xác với tag gắn cho patch; danh sách nhiều tag ngăn cách bằng dấu chấm phẩy.</p>
      <p><b>Ví dụ:</b> <code>size_large</code> → <code>size_small</code>. Với thú cưng đi cùng hoa cùng màu, đặt <code>source_tags=pet</code>, <code>target_tags=flower</code>, <code>required_shared_prefix=color_</code>; hai patch phải cùng có tag màu như <code>color_pink</code>.</p>
      <p>Rule mẫu trong template đang để <code>active=false</code>, nên không ảnh hưởng gợi ý cho đến khi bạn bật chúng.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 18 }}>
        <a href="/recommendation-rules-template.csv" download style={{ display: 'inline-block', padding: '12px 16px', borderRadius: 10, background: '#f1ebff', color: '#493a70', fontWeight: 700, textDecoration: 'none' }}>Tải CSV mẫu</a>
        <label style={{ display: 'inline-block', padding: '12px 16px', borderRadius: 10, background: '#f4f1eb', cursor: 'pointer', fontWeight: 700 }}>Chọn file CSV<input type="file" accept=".csv,text/csv" onChange={event => preview(event.target.files?.[0])} style={{ display: 'block', marginTop: 8 }}/></label>
      </div>
      {savedCount !== null && <p style={{ marginTop: 18 }}>Đang lưu: <b>{savedCount}</b> quy tắc, trong đó <b>{savedActiveCount}</b> đang bật.</p>}
      {message && <pre style={{ whiteSpace: 'pre-wrap', padding: 14, borderRadius: 10, background: errors.length ? '#fff1ed' : '#f2f8ec', color: '#38342f' }}>{message}</pre>}
      {errors.length > 0 && <ul style={{ color: '#a33' }}>{errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>}
      {rules.length > 0 && <><p><b>Xem trước {rules.length} dòng</b> · {rules.filter(rule => rule.active).length} rule đang bật trong file</p><div style={{ overflowX: 'auto', maxHeight: 360, border: '1px solid #eee', borderRadius: 10 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr>{['ID','Tag patch đã chọn','Tag patch gợi ý','Tag chung bắt buộc','Điểm','Bật'].map(title => <th key={title} style={{ textAlign: 'left', padding: 10, background: '#faf8f5', position: 'sticky', top: 0 }}>{title}</th>)}</tr></thead><tbody>{rules.map(rule => <tr key={rule.rule_id}><td style={{ padding: 10 }}>{rule.rule_id}</td><td style={{ padding: 10 }}>{rule.source_tags.join('; ')}</td><td style={{ padding: 10 }}>{rule.target_tags.join('; ')}</td><td style={{ padding: 10 }}>{rule.required_shared_prefix || '—'}</td><td style={{ padding: 10 }}>{rule.score}</td><td style={{ padding: 10 }}>{rule.active ? 'Có' : 'Không'}</td></tr>)}</tbody></table></div></>}
      <button type="button" disabled={!file || errors.length > 0 || busy} onClick={saveRules} style={{ marginTop: 18, padding: '12px 18px', border: 0, borderRadius: 10, background: '#26231f', color: '#fff', fontWeight: 700, opacity: !file || errors.length > 0 || busy ? .5 : 1, cursor: 'pointer' }}>{busy ? 'Đang lưu…' : 'Lưu bộ quy tắc gợi ý'}</button>
    </section>
    <p style={{ marginTop: 18, color: '#716b63' }}>Bạn có thể upload bộ quy tắc sau bất cứ lúc nào. Upload file mới sẽ thay thế toàn bộ bộ quy tắc đã lưu trước đó; tải bộ hiện tại ra ngoài trước nếu muốn giữ bản cũ.</p>
  </main>;
}
