import './globals.css';
import './size-guide.css';

export const metadata = { title: 'Patchie Studio — Tự custom áo của bạn', description: 'Tự phối patch thêu ủi lên áo Patchie, lưu mockup và gửi cho shop.' };

export default function RootLayout({ children }) {
  return <html lang="vi"><body>{children}</body></html>;
}
