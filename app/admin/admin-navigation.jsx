 'use client';
import Link from 'next/link';
import {usePathname,useSearchParams} from 'next/navigation';
const groups=[
 ['BÁN HÀNG',[['Đơn hàng','/admin?tab=requests']]],
 ['SẢN PHẨM',[['Sản phẩm base','/admin?tab=products'],['Thư viện patch','/admin?tab=patches'],['Import patch','/admin/import'],['Mẫu phối sẵn','/admin/product-designs']]],
 ['CỬA HÀNG',[['Best-seller tháng này','/admin/bestsellers'],['Patch Market','/admin/market'],['Lookbook','/admin/gallery']]],
 ['THIẾT LẬP',[['Thương hiệu & nội dung','/admin?tab=brand'],['Chia sẻ link','/admin/social-sharing'],['Website & Christmas','/admin?tab=settings'],['Quy tắc gợi ý','/admin/recommendations']]]
];
export default function AdminNavigation(){
 const path=usePathname(),params=useSearchParams(),current=path==='/admin'?'/admin?tab='+(params.get('tab')||'requests'):path;
 return <aside className="admin-global-nav"><a className="admin-nav-brand" href="/admin">patchie<span>SHOP DESK ✦</span></a><nav aria-label="Quản trị cửa hàng">{groups.map(([title,links])=><section key={title}><h2>{title}</h2>{links.map(([label,href])=><Link key={href} href={href} prefetch={false} className={current===href?'is-current':''} aria-current={current===href?'page':undefined}>{label}</Link>)}</section>)}</nav><a className="admin-nav-store" href="/" target="_blank" rel="noreferrer">Xem cửa hàng ↗</a></aside>;
}
