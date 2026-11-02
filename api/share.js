const SITE="https://gestao-estaca.vercel.app";
const FALLBACK_IMAGE=SITE+"/logo-estaca.svg";
function escapeHtml(value){return String(value||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function description(value){return String(value||"").replace(/\s+/g," ").trim().slice(0,200);}
export default async function handler(req,res){
  const id=String(req.query?.id||"");
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return res.status(404).send("Publicação não encontrada.");
  const ua=String(req.headers["user-agent"]||"");
  const isBot=/WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|TelegramBot|Discordbot|Slackbot|SkypeUriPreview|Googlebot|bingbot/i.test(ua);
  if(!isBot)return res.redirect(302,"/?post="+encodeURIComponent(id)+"#post-"+encodeURIComponent(id));
  const supabaseUrl=process.env.VITE_SUPABASE_URL;
  const anonKey=process.env.VITE_SUPABASE_ANON_KEY;
  let post=null;
  if(supabaseUrl&&anonKey){
    try{
      const endpoint=supabaseUrl.replace(/\/$/,"")+"/rest/v1/posts?id=eq."+encodeURIComponent(id)+"&published=eq.true&select=id,title,body,image_url&limit=1";
      const response=await fetch(endpoint,{headers:{apikey:anonKey,Authorization:"Bearer "+anonKey}});
      if(response.ok){const rows=await response.json();post=rows[0]||null;}
    }catch(error){console.error("Share preview lookup failed:",error);}
  }
  if(!post)return res.status(404).send("Esta publicação não está disponível para compartilhamento.");
  const title=escapeHtml(post.title||"Publicação — Gestão Estaca Horto");
  const desc=escapeHtml(description(post.body)||"Veja esta publicação no aplicativo Gestão Estaca Horto.");
  const image=escapeHtml(post.image_url||FALLBACK_IMAGE);
  const canonical=SITE+"/p/"+encodeURIComponent(id);
  const html="<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>"+title+"</title><meta name=\"description\" content=\""+desc+"\"><link rel=\"canonical\" href=\""+canonical+"\"><meta property=\"og:type\" content=\"article\"><meta property=\"og:site_name\" content=\"Gestão Estaca Horto\"><meta property=\"og:title\" content=\""+title+"\"><meta property=\"og:description\" content=\""+desc+"\"><meta property=\"og:url\" content=\""+canonical+"\"><meta property=\"og:image\" content=\""+image+"\"><meta property=\"og:image:alt\" content=\"Imagem da publicação ou símbolo da Estaca Horto\"><meta name=\"twitter:card\" content=\"summary_large_image\"><meta name=\"twitter:title\" content=\""+title+"\"><meta name=\"twitter:description\" content=\""+desc+"\"><meta name=\"twitter:image\" content=\""+image+"\"></head><body><h1>"+title+"</h1><p>"+desc+"</p><p><a href=\""+SITE+"/?post="+encodeURIComponent(id)+"#post-"+encodeURIComponent(id)+"\">Abrir no Gestão Estaca Horto</a></p></body></html>";
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(html);
}
