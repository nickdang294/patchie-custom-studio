import { revalidateTag } from 'next/cache';

export const CATALOG_CACHE_TAG = 'patchie-initial-catalog';

// Also invalidate after partial writes that return an error. Auth failures do
// not evict the public cache; the original handler still owns authorization.
export function withCatalogInvalidation(handler) {
  return async function (...args) {
    let response;
    try {
      response = await handler(...args);
      return response;
    } finally {
      if (!response || ![401, 403].includes(response.status)) {
        revalidateTag(CATALOG_CACHE_TAG);
      }
    }
  };
}
