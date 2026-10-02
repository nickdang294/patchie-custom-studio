'use client';

import Script from 'next/script';
import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const META_PIXEL_ID = '1430709925658613';

function MetaPixelRouteView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname || '/'}?${searchParams.toString()}`;
  const lastRoute = useRef(null);

  useEffect(() => {
    if (lastRoute.current === null) {
      lastRoute.current = routeKey;
      return;
    }

    if (lastRoute.current !== routeKey && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
    lastRoute.current = routeKey;
  }, [routeKey]);

  return null;
}

export default function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <Suspense fallback={null}>
        <MetaPixelRouteView />
      </Suspense>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
