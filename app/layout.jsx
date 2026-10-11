import './globals.css';
import './size-guide.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import MetaPixel from './meta-pixel';

export const metadata = { title: 'Patchie Studio — Tự custom áo của bạn', description: 'Tự phối patch thêu ủi lên áo Patchie, lưu mockup và gửi cho shop.' };

export default function RootLayout({ children }) {
  return <html lang="vi"><head><link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="preload" href="/fonts/dm-sans-latin-ext.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head><body>{children}<MetaPixel/><Analytics/><SpeedInsights/></body></html>;
}
