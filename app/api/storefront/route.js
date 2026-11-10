import {listStorefront,storefrontDetail} from '@/lib/storefront-server';
export const dynamic='force-dynamic';
export async function GET(request){try{const q=new URL(request.url).searchParams;
 if(q.has('id')){const detail=await storefrontDetail(q.get('id'));return detail?Response.json(detail):Response.json({error:'Nội dung không còn hiển thị.'},{status:404});}
 const offset=Number(q.get('offset')||0);if(!Number.isInteger(offset)||offset<0||offset>100000)return Response.json({error:'Trang không hợp lệ.'},{status:400});
 return Response.json(await listStorefront({kind:q.get('kind'),group:q.get('group')||'',offset}),{headers:{'Cache-Control':'no-store'}});
}catch{return Response.json({error:'Chưa tải được nội dung. Bạn thử lại nhé.'},{status:503});}}
