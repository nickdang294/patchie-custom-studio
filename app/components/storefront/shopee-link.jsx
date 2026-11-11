'use client';
import {trackEvent} from '@/lib/analytics';
import {shopeeUrl} from '@/lib/storefront';
export default function ShopeeLink({url,id,kind,location,children,className=''}){const href=shopeeUrl(url);if(!href)return null;return <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={()=>trackEvent('Shopee Click',{kind:kind||'design',location:location||'detail'})}>{children} ↗</a>;}
