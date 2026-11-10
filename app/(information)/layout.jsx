import SiteHeader from '../components/site-header';
import SiteFooter from '../components/site-footer';
import {serviceDb} from '@/lib/supabase';
import './information.css';
export const dynamic='force-dynamic';
export default async function InformationLayout({children}){let brand={};try{const result=await serviceDb().from('settings').select('value').eq('key','brand').maybeSingle();brand=result.data?.value||{};}catch{}return <div className="information-shell"><SiteHeader brand={brand} active=""/><main id="information-content">{children}</main><SiteFooter/></div>}
