'use client';
import {usePathname} from 'next/navigation';
import './site-header.css';
const links=[['/','Tự phối'],['/patches','BST patch'],['/looks','Góc phối xinh']];
export default function SiteHeader({brand={},active}){
 const pathname=usePathname();const current=pathname||active;
 return <header className="patchie-header"><a href="/" className="patchie-header-logo" aria-label="Patchie — trang chủ">{brand.logoUrl?<img src={brand.logoUrl} alt={brand.brandName||'Patchie'} width="2162" height="727" decoding="async"/>:<span>patchie ✦</span>}</a><a className="patchie-about-link" href="/chuyen-nha-patchie" aria-current={current==='/chuyen-nha-patchie'?'page':undefined}>Về Patchie</a><nav className="patchie-header-nav" aria-label="Điều hướng chính">{links.map(([href,label])=><a key={href} href={href} aria-current={current===href?'page':undefined}>{label}</a>)}</nav></header>;
}
