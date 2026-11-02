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
    const promptText=String(req.body?.prompt||"").slice(0,5000);
    const negativePrompt=String(req.body?.negative_prompt||"").slice(0,1200);
    const prompt=promptText
      ? promptText+(negativePrompt?"\nAvoid these elements: "+negativePrompt:"")
      : "A specific, respectful scene illustrating this publication: "+title+". "+body+". No cross, no stained glass, no church interior, no crowded congregation, no text. Soft painterly editorial illustration, warm natural light.";
    const upstream=await fetch("https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/images/generations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"stabilityai/stable-diffusion-xl-base-1.0",prompt,n:1,size:"1024x1024",response_format:"b64_json"})});
    const payload=await upstream.json().catch(()=>({}));
    if(!upstream.ok){const limited=upstream.status===429;const unavailable=upstream.status>=500;const message=limited?"O gerador gratuito atingiu o limite temporário de pedidos. Aguarde um pouco e toque em tentar novamente.":unavailable?"O serviço gratuito de imagens está instável no momento. Tente novamente em alguns instantes.":(payload.error?.message||"Não foi possível gerar a imagem. Confira o texto e tente novamente.");return res.status(limited?429:502).json({error:message,retryable:limited||unavailable});}
    const b64=payload.data?.[0]?.b64_json;
    if(!b64)return res.status(502).json({error:"O serviço não retornou uma imagem válida."});
    return res.status(200).json({b64_json:b64});
  }catch(e){console.error("Image generation error:",e);return res.status(500).json({error:"Não foi possível concluir a geração. O serviço gratuito pode estar temporariamente indisponível; tente novamente em instantes.",retryable:true});}
}