'use client';
import {useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
export default function PasswordLogin({onSuccess,initialMessage=''}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[recover,setRecover]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(initialMessage),[visible,setVisible]=useState(false);
 async function submit(event){
  event.preventDefault();if(busy)return;setBusy(true);setMessage('');
  try{
   const client=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
   if(recover){
    const {error}=await client.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+'/auth/recovery'});
    if(error)throw error;
    setMessage('Nếu email này đã có tài khoản, link đặt mật khẩu sẽ được gửi tới hộp thư. Mở link trong cùng trình duyệt vừa gửi yêu cầu nhé.');
   }else{
    const {error}=await client.auth.signInWithPassword({email:email.trim(),password});
    if(error){setMessage('Chưa đăng nhập được. Kiểm tra email và mật khẩu, hoặc chọn Quên / tạo mật khẩu.');return;}
    setPassword('');await onSuccess();
   }
  }catch(error){setMessage(error.status===429?'Bạn gửi quá nhiều yêu cầu. Chờ một chút rồi thử lại nhé.':'Chưa kết nối được. Thử lại sau một chút nhé.');}finally{setBusy(false);}
 }
 return <main className="admin-shell"><div className="login-card"><a className="brand" href="/">Patchie ✦</a><div className="eyebrow">KHU VỰC QUẢN TRỊ</div><h1>{recover?'Đặt lại mật khẩu':'Đăng nhập shop'}</h1><p>{recover?'Dùng email admin hiện tại để tạo mật khẩu lần đầu hoặc đặt lại mật khẩu.':'Chào mừng quay lại góc workshop của Patchie.'}</p><form onSubmit={submit}><label>Email quản trị<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ban@patchie.vn" disabled={busy}/></label>{!recover&&<><label>Mật khẩu<input type={visible?'text':'password'} required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label><label style={{display:'flex',gap:8,alignItems:'center',fontSize:12}}><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)} style={{width:'auto'}}/>Hiện mật khẩu</label></>}<button className="button dark full" disabled={busy}>{busy?'Đang xử lý…':recover?'Gửi email đặt mật khẩu':'Đăng nhập'}</button></form>{message&&<p className="admin-msg" role="status">{message}</p>}<button type="button" className="button light full" disabled={busy} onClick={()=>{setRecover(!recover);setMessage('');setPassword('');}}>{recover?'← Quay lại đăng nhập':'Quên / tạo mật khẩu'}</button><a className="back-link" href="/">← Về studio</a></div></main>;
}
