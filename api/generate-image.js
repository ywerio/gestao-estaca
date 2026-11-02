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
    // Identifica temas históricos e escriturísticos conhecidos antes de chamar o gerador.
    // Isso evita depender da capacidade limitada do modelo de imagem para interpretar textos longos.
    const sourceText=(title+" "+body).normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();
    let sceneBrief="";
    if(/primeira visao|joseph smith|bosque sagrado/.test(sourceText)){
      sceneBrief="SPECIFIC SCENE — THE FIRST VISION: Depict the historical event known as the First Vision in the spring of 1820. In the foreground, a 14-year-old Joseph Smith, a young farm boy in simple early-19th-century rural clothing, is kneeling alone in earnest prayer in a quiet grove of trees in upstate New York. Tall woodland trees and natural undergrowth clearly surround him. A brilliant, vertical pillar of heavenly light descends from the sky and illuminates Joseph. Within the radiant light above him are TWO distinct, glorious heavenly Personages, God the Father and Jesus Christ, standing or hovering together above Joseph; portray them respectfully as separate figures in simple, luminous white robes, without halos or fantasy armor. Joseph looks upward in awe. The grove, kneeling boy, descending pillar of light, and two heavenly Personages must all be clearly visible and form the unmistakable central subject. Historically grounded 1820 setting, spring woodland, cinematic but reverent realistic illustration. Do not depict a church building, congregation, modern clothing, a generic person praying indoors, or unrelated scenes.";
    }
    // O texto de origem é português. O prompt orienta o modelo a interpretar o conteúdo antes de decidir a cena.
    const prompt=[
      "Create one high-quality editorial illustration for an official, respectful publication of The Church of Jesus Christ of Latter-day Saints.",
      "IMPORTANT CONTENT-UNDERSTANDING INSTRUCTION: The source title and message below are written in Brazilian Portuguese. First understand their meaning and mentally translate them into English. Identify the single central message, subject, and action. Then create an image that communicates THAT specific central idea clearly. Do not make a generic religious, family, church, or people image unless that is truly the main subject of the message.",
      "VISUAL PRIORITY: The central subject from the message must dominate the composition and be immediately recognizable. Use supporting details only when they reinforce that subject. If the message is about an event, depict the actual event or its defining activity; if it is about service, show the service; if it is about scripture, show scripture study; if it is about Jesus Christ, use a reverent biblical depiction of Jesus Christ. Do not invent unrelated scenes.",
      "FAITH AND CULTURAL CONTEXT: Keep the visual language consistent with The Church of Jesus Christ of Latter-day Saints and the Bible. When relevant to the actual message, appropriate visual references may include the Bible, the Book of Mormon, missionaries, a meetinghouse, a temple exterior, family worship, prayer, ministering, or Christ-centered service. Use these references only when they fit the message; do not force them into every image. Depict biblical settings and people respectfully. Do not show temple interiors, sacred ordinances, or ceremonial details.",
      "STYLE: Warm, hopeful, dignified, authentic, welcoming, polished realistic editorial illustration, natural light, clear visual storytelling, balanced composition. Prefer a specific meaningful scene over abstract symbols or decorative effects.",
      "RESTRICTIONS: No written words, captions, lettering, logos, watermarks, crosses, or unrelated religious symbols. Do not distort scriptures or depict sacred ordinances inaccurately.",
      sceneBrief || "SCENE SELECTION: Carefully identify the central event and depict that exact event, not a generic religious scene.",
      "SOURCE TITLE IN BRAZILIAN PORTUGUESE: "+title,
      "SOURCE MESSAGE IN BRAZILIAN PORTUGUESE: "+body,
      "Final check: the image must visibly communicate the main subject of the Portuguese message, not merely its general religious atmosphere."
    ].join("\n\n");
    const upstream=await fetch("https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/images/generations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"stabilityai/stable-diffusion-xl-base-1.0",prompt,n:1,size:"1024x1024",response_format:"b64_json"})});
    const payload=await upstream.json().catch(()=>({}));
    if(!upstream.ok)return res.status(upstream.status===429?429:502).json({error:upstream.status===429?"Limite temporário de geração atingido. Aguarde um minuto e tente novamente.":(payload.error?.message||"O serviço gratuito de imagem está temporariamente indisponível.")});
    const b64=payload.data?.[0]?.b64_json;
    if(!b64)return res.status(502).json({error:"O serviço não retornou uma imagem válida."});
    return res.status(200).json({b64_json:b64});
  }catch(e){return res.status(500).json({error:"Falha ao conectar ao serviço de geração de imagens."});}
}