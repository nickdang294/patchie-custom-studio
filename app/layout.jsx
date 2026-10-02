import './globals.css';
import './size-guide.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = { title: 'Patchie Studio — Tự custom áo của bạn', description: 'Tự phối patch thêu ủi lên áo Patchie, lưu mockup và gửi cho shop.' };

export default function RootLayout({ children }) {
  return <html lang="vi"><body>{children}<Analytics/><SpeedInsights/></body></html>;
}
