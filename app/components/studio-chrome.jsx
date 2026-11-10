import {BRAND_DEFAULTS} from '@/lib/studio-brand';

import SiteHeader from './site-header';

export const StudioHeader=({brand})=><SiteHeader brand={brand} active="/"/>;

export const StudioHero=({brand})=><section className="hero"><div><div className="eyebrow">{brand.heroEyebrow}</div><h1>{brand.heroTitle}<br/><em>{brand.heroAccent}</em></h1><p>{brand.heroDescription}</p></div></section>;
export const LoadingAnimation=({})=> <section className="catalog-loading loading-card"><div className="loading-art" aria-hidden="true"><div className="loading-tee"><span>P</span></div><i className="loading-patch loading-patch-a">✦</i><i className="loading-patch loading-patch-b">♡</i><i className="loading-patch loading-patch-c">☀</i><i className="loading-patch loading-patch-d">✿</i><span className="loading-spark loading-spark-a">✧</span><span className="loading-spark loading-spark-b">✦</span></div><b>Đang dán chút đáng yêu lên shop…</b><p>Patchie đang gom sản phẩm base và mấy miếng patch xinh cho bạn.</p><div className="loading-dots" aria-label="Đang tải"><i></i><i></i><i></i></div></section>;

export function StudioContainer({embedded,children,...props}) {
  return embedded ? <>{children}</> : <main {...props}>{children}</main>;
}
