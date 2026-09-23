import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu cấu hình Supabase trên server.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function userClient() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => jar.getAll(), setAll: (values) => { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch {} } }
  });
}

export async function requireAdmin() {
  const supabase = await userClient();
  const { data: { user } } = await supabase.auth.getUser();
  const allowed = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  try {
    const { data } = await serviceDb().from('settings').select('value').eq('key','adminEmails').maybeSingle();
    if (Array.isArray(data?.value)) allowed.push(...data.value.map(x=>String(x).toLowerCase()));
  } catch {}
  if (!user || !allowed.includes((user.email || '').toLowerCase())) return { error: 'Tài khoản này chưa được cấp quyền quản trị.', status: user ? 403 : 401 };
  return { user };
}

export function jsonError(message, status = 400) { return Response.json({ error: message }, { status }); }
