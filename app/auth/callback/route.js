import { NextResponse } from 'next/server';
import { userClient } from '@/lib/supabase';

export async function GET(request) {
  const url=new URL(request.url), code=url.searchParams.get('code');
  if(code){const supabase=await userClient();await supabase.auth.exchangeCodeForSession(code);}
  return NextResponse.redirect(new URL('/admin',url.origin));
}
