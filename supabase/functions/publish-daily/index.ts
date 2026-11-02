import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
Deno.serve(async (req) => {
 const secret=Deno.env.get('DAILY_PUBLISH_SECRET');
 if(req.method!=='POST'||req.headers.get('Authorization')!=='Bearer '+secret)return new Response('Unauthorized',{status:401});
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const today=new Date().toISOString().slice(0,10);
 const {data:item,error}=await db.from('daily_publications').select('*').eq('publish_date',today).eq('enabled',true).is('published_post_id',null).maybeSingle();
 if(error)return Response.json({error:error.message},{status:500});
 if(!item)return Response.json({published:false,reason:'Nenhuma publicação programada.'});
 const {data:post,error:err}=await db.from('posts').insert({title:item.title,body:item.body,kind:'Reflexão diária',source_url:item.source_url,unit_type:'estaca',published:true}).select('id').single();
 if(err)return Response.json({error:err.message},{status:500});
 await db.from('daily_publications').update({published_post_id:post.id}).eq('id',item.id);
 return Response.json({published:true,post_id:post.id});
});