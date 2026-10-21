'use client';
import {useEffect,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import './reset-password.css';
export default function ResetPassword(){
 const [ready,setReady]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{let alive=true;async function check(){try{
  if(new URLSearchParams(window.location.search).has('error'))throw Error();
  const client=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const {data,error}=await client.auth.getUser();if(error||!data.user)throw Error();if(alive)setReady(true);
 }catch{if(alive)setMessage('Link đã hết hạn, đã dùng hoặc được mở ở trình duyệt khác. Về đăng nhập để gửi lại email nhé.');}finally{if(alive)setLoading(false);}}check();return()=>{alive=false};},[]);
 async function save(event){event.preventDefault();if(busy)return;
  if(password.length<8)return setMessage('Mật khẩu cần ít nhất 8 ký tự.');
  if(password!==confirm)return setMessage('Hai mật khẩu chưa khớp nhau.');
  setBusy(true);setMessage('');
  try{const client=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
   const {error}=await client.auth.updateUser({password});if(error){setMessage(error.message);return;}
   setPassword('');setConfirm('');setDone(true);
   // The admin APIs still check the existing email allowlist on every request.
  }catch{setMessage('Chưa lưu được mật khẩu. Kiểm tra kết nối rồi thử lại nhé.');}finally{setBusy(false);}
 }
 return <main className="password-shell"><section className="password-card"><a href="/" className="password-brand">patchie ✦</a><h1>{done?'Đã lưu mật khẩu':'Đặt mật khẩu mới'}</h1>{loading?<p>Đang kiểm tra link…</p>:done?<><p>Lần sau bạn có thể đăng nhập bằng email và mật khẩu vừa đặt.</p><a className="password-primary" href="/admin">Vào trang quản trị →</a></>:ready?<form onSubmit={save}><label>Mật khẩu mới<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label><label>Nhập lại mật khẩu<input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={busy}/></label><small>Ít nhất 8 ký tự; đáp ứng thêm yêu cầu mật khẩu của shop nếu có.</small><button className="password-primary" disabled={busy}>{busy?'Đang lưu…':'Lưu mật khẩu'}</button></form>:null}{message&&<p role="status">{message}</p>}{!done&&<a href="/admin">← Về đăng nhập</a>}</section></main>;
}
