import { serviceDb } from '@/lib/supabase';

export async function GET(request){
  if(!process.env.CRON_SECRET||request.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return Response.json({error:'Unauthorized'},{status:401});
  const db=serviceDb(),{data,error}=await db.from('designs').select('id,image_path').lte('expires_at',new Date().toISOString()).limit(1000);
  if(error)return Response.json({error:error.message},{status:500});
  if(data?.length){const paths=data.map(x=>x.image_path).filter(Boolean);if(paths.length)await db.storage.from('design-mockups').remove(paths);const {error:delError}=await db.from('designs').delete().in('id',data.map(x=>x.id));if(delError)return Response.json({error:delError.message},{status:500});}
  return Response.json({deleted:data?.length||0});
}
