import {serviceDb} from '@/lib/supabase';
import {listStorefront} from '@/lib/storefront-server';
import Catalog from './catalog';
export default async function CatalogPage({kind,searchParams}){
 const params=await searchParams;const group=typeof params?.group==='string'?params.group:'';
 let initial={items:[],groups:[],hasMore:false},brand={},error='';
 try{const [list,settings]=await Promise.all([listStorefront({kind,group}),serviceDb().from('settings').select('value').eq('key','brand').maybeSingle()]);initial=list;brand=settings.data?.value||{};}catch{error='Chưa tải được nội dung. Bạn thử lại nhé.';}
 return <Catalog kind={kind} initial={initial} initialGroup={group} brand={brand} initialError={error}/>;
}
