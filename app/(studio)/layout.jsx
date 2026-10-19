import '../studio.css';
import '../size-guide.css';
import {loadInitialCatalog} from '@/lib/catalog-server';
import {getStudioBrand} from '@/lib/studio-brand';
import {normalizeHalloweenFeatures} from '@/lib/halloween-theme';
import {StudioHeader, StudioHero} from '../components/studio-chrome';
const cssContent=value=>JSON.stringify(String(value||''));

export default async function StudioLayout({children}) {
  let catalog;
  try { catalog=await loadInitialCatalog(); } catch { return children; }
  const brand=getStudioBrand(catalog.settings);
  const halloweenThemeEnabled=catalog.settings.halloweenThemeEnabled!==false;
  const halloweenFeatures=normalizeHalloweenFeatures(catalog.settings.halloweenFeatures);
  return <>
    <link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/>
    <link rel="preload" href="/fonts/manrope-vietnamese.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/>
    <main className={`shell ${halloweenThemeEnabled?'theme-halloween':''} ${halloweenFeatures.cobwebs?'theme-cobwebs':''}`} style={{'--patchie-font':brand.fontFamily,'--step-base-desktop':cssContent(brand.stepBaseDesktop),'--step-base-mobile':cssContent(brand.stepBaseMobile),'--step-patch-desktop':cssContent(brand.stepPatchDesktop),'--step-patch-mobile':cssContent(brand.stepPatchMobile),'--step-preview-desktop':cssContent(brand.stepPreviewDesktop),'--step-preview-mobile':cssContent(brand.stepPreviewMobile),'--step-order-desktop':cssContent(brand.stepOrderDesktop),'--step-order-mobile':cssContent(brand.stepOrderMobile),'--step1-desktop':cssContent(brand.stepBaseDesktop),'--step1-mobile':cssContent(brand.stepBaseMobile),'--step2-desktop':cssContent(brand.stepPatchDesktop),'--step2-mobile':cssContent(brand.stepPatchMobile)}}><StudioHeader brand={brand}/><StudioHero brand={brand}/>{children}</main>
  </>;
}
