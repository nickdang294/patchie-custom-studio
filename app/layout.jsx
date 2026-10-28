import './christmas.css';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import MetaPixel from './meta-pixel';

import {generateSocialMetadata} from '@/lib/social-sharing-server';
export const generateMetadata = generateSocialMetadata;

export default function RootLayout({ children }) {
  return <html lang="vi"><body>{children}<MetaPixel/><Analytics/><SpeedInsights/></body></html>;
}
