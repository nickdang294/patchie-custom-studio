import Studio from '../studio-client';
import {loadInitialCatalog} from '@/lib/catalog-server';
export const dynamic='force-dynamic';
export const revalidate=0;
export default async function Page(){
  let catalog=null;
  try{catalog=await loadInitialCatalog();}catch{}
  return <Studio initialCatalog={catalog} embedded={Boolean(catalog)}/>;
}
