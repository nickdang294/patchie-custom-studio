import CatalogPage from '../components/storefront/catalog-page';
export const dynamic='force-dynamic';
export const metadata={title:'Bộ sưu tập patch | Patchie'};
export default function Page(props){return <CatalogPage {...props} kind="collection"/>;}
