'use client';
import {usePathname} from 'next/navigation';
import './site-header.css';
const links=[['/chuyen-nha-patchie','Chuyện nhà Patchie'],['/','Tự phối'],['/patches','BST patch'],['/looks','Góc phối xinh'],['/lien-he','Liên hệ Patchie']];
export default function SiteHeader({brand={},active}){
 const pathname=usePathname();const current=pathname||active;
 return <header className="patchie-header"><a href="/" className="patchie-header-logo" aria-label="Patchie — trang chủ">{brand.logoUrl?<img src={brand.logoUrl} alt={brand.brandName||'Patchie'} width="2162" height="727" decoding="async"/>:<span>patchie ✦</span>}</a><nav className="patchie-header-nav" aria-label="Điều hướng chính">{links.map(([href,label])=><a key={href} href={href} aria-current={current===href?'page':undefined}>{label}</a>)}</nav></header>;
}
