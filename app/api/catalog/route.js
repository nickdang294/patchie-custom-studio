import {loadCatalog} from '@/lib/catalog-server';
import {jsonError} from '@/lib/supabase';
export const dynamic='force-dynamic';
export const revalidate=0;
export async function GET(){try{return Response.json(await loadCatalog(),{headers:{'Cache-Control':'no-store, max-age=0'}});}catch(e){return jsonError(e.message||'Không tải được danh mục.',503);}}
