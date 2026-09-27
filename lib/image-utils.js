export function previewImageUrl(source,width=480){
  const value=String(source||'').trim();
  if(!value||value.startsWith('/'))return value;
  try{
    const url=new URL(value);
    const marker='/storage/v1/object/public/';
    const index=url.pathname.indexOf(marker);
    if(index<0)return value;
    url.pathname=`${url.pathname.slice(0,index)}/storage/v1/render/image/public/${url.pathname.slice(index+marker.length)}`;
    url.searchParams.set('width',String(width));
    url.searchParams.set('quality','72');
    url.searchParams.set('resize','contain');
    return url.toString();
  }catch{return value;}
}
