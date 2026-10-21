import {NextResponse} from 'next/server';
import {userClient} from '@/lib/supabase';
export async function GET(request){
 const url=new URL(request.url),code=url.searchParams.get('code');
 if(code&&!url.searchParams.has('error')){
  try{const client=await userClient();const {error}=await client.auth.exchangeCodeForSession(code);
   if(!error)return NextResponse.redirect(new URL('/auth/reset-password',url.origin));
  }catch{}
 }
 return NextResponse.redirect(new URL('/auth/reset-password?error=expired',url.origin));
}
