import {unstable_cache} from 'next/cache';
import {serviceDb} from './supabase';
import {socialMetadata} from './social-sharing';
export const SOCIAL_CACHE_TAG = 'patchie-social-sharing';
const readSocial = unstable_cache(async () => {
  const {data, error} = await serviceDb().from('settings').select('value').eq('key', 'socialSharing').maybeSingle();
  if (error) throw error;
  return data?.value || {};
}, ['patchie-social-sharing-v1'], {tags: [SOCIAL_CACHE_TAG], revalidate: 300});
export async function generateSocialMetadata() {
  try { return socialMetadata(await readSocial()); }
  catch { return socialMetadata(); }
}
