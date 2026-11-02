export default async function handler(req,res){
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Método não permitido."});}
  try{
    const token=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
    const supabaseUrl=process.env.VITE_SUPABASE_URL;
    const anonKey=process.env.VITE_SUPABASE_ANON_KEY;
    if(!token||!supabaseUrl||!anonKey)return res.status(401).json({error:"Entre no aplicativo para gerar uma imagem."});
    const auth=await fetch(supabaseUrl+"/auth/v1/user",{headers:{apikey:anonKey,Authorization:"Bearer "+token}});
    if(!auth.ok)return res.status(401).json({error:"Sua sessão expirou. Entre novamente."});
    const user=await auth.json();
    const profileRes=await fetch(supabaseUrl+"/rest/v1/profiles?id=eq."+encodeURIComponent(user.id)+"&select=status",{headers:{apikey:anonKey,Authorization:"Bearer "+token}});
    const profiles=profileRes.ok?await profileRes.json():[];
    if(!profiles.some(p=>p.status==="approved"))return res.status(403).json({error:"Somente usuários aprovados podem gerar imagens."});
    const title=String(req.body?.title||"").slice(0,180);
    const body=String(req.body?.body||"").slice(0,900);
    if(!title&&!body)return res.status(400).json({error:"Informe o título ou o texto da publicação."});
    const prompt="Create a high-quality, warm, respectful editorial illustration for a Latter-day Saint congregation bulletin. Theme: "+title+". Context: "+body+". Show a hopeful, welcoming scene with diverse ordinary people, tasteful composition, natural light, polished realistic illustration. No written words, no lettering, no logos, no watermark, no crosses. Avoid depicting sacred ordinances inaccurately.";
    const upstream=await fetch("https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/images/generations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"stabilityai/stable-diffusion-xl-base-1.0",prompt,n:1,size:"1024x1024",response_format:"b64_json"})});
    const payload=await upstream.json().catch(()=>({}));
    if(!upstream.ok)return res.status(upstream.status===429?429:502).json({error:upstream.status===429?"Limite temporário de geração atingido. Aguarde um minuto e tente novamente.":(payload.error?.message||"O serviço gratuito de imagem está temporariamente indisponível.")});
    const b64=payload.data?.[0]?.b64_json;
    if(!b64)return res.status(502).json({error:"O serviço não retornou uma imagem válida."});
    return res.status(200).json({b64_json:b64});
  }catch(e){return res.status(500).json({error:"Falha ao conectar ao serviço de geração de imagens."});}
}