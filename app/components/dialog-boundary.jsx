'use client';

import {lazy, Suspense} from 'react';

// The stylesheet is part of this async chunk. React reveals a dialog only
// after its code and CSS are ready, so it never flashes unstyled content.
const DialogSurface=lazy(()=>import('./dialog-surface'));
export default function DialogBoundary(props) {
  return <Suspense fallback={null}><DialogSurface {...props}/></Suspense>;
}
