const STYLE = "soft painterly editorial illustration, warm natural light, reverent peaceful mood, gentle natural color palette, cinematic composition, clear visual storytelling";
const NEGATIVE = "cross, crucifix, stained glass, generic church interior, crowded congregation, pews, priest robes, text, letters, watermark, logo, distorted anatomy, deformed hands, extra fingers, malformed faces, duplicate people, cartoon, anime";
const SYSTEM = `You are an expert visual art director for a publication app of The Church of Jesus Christ of Latter-day Saints in Brazil. Read the Portuguese title and text. Identify the CENTRAL subject and create one concrete, faithful visual scene. Return ONLY valid JSON: {"prompt":"...","negative_prompt":"..."}. Prompt in English, 35-75 words; describe setting, subject, action, historical period, lighting and composition. Never default to church interiors, crowds, pews, congregations, crosses, crucifixes or stained glass. Do not show recognizable modern faces. For divine manifestations, depict divine presence as light rather than identifiable faces. Historical scenes need period-appropriate clothing. No text, letters, signs, logos or watermarks. Choose the most iconic literal scene, not generic religious mood.
Examples:
- First Vision / Joseph Smith: sacred grove in upstate New York, spring 1820, a 14-year-old boy in period farm clothes kneeling in prayer seen from behind, a pillar of brilliant heavenly light descending through tall trees.
- Book of Mormon: open book, ancient American landscape, lush forest and distant stepped stone temple at sunrise.
- Baptism: calm river or simple white baptismal font, two people in white, water visible, no crowd.
- Sacrament: bread and water trays on a simple white-clothed table, hands only, soft window light.
- Fasting and prayer: one person kneeling beside a bed or window at dawn.
- Temple: white temple exterior at sunrise, landscaped gardens, no crowd, no cross.
- Missionaries: two missionaries in white shirts and name tags walking on a Brazilian street, seen from behind.
- Service: people helping with a concrete task such as planting, cleaning or carrying supplies.
- Family: family at home sharing a meaningful activity, natural candid composition.`;
const FALLBACKS = [
[/primeira vis[aã]o|bosque sagrado|joseph smith/i,"Spring 1820 in upstate New York: a 14-year-old farm boy in simple 1820s rural clothing kneels in prayer, seen from behind, in a quiet grove of tall trees. A brilliant vertical pillar of heavenly light descends through the canopy and illuminates the forest clearing."],
[/livro de m[oó]rmon|m[oó]rmon/i,"An open book rests in the foreground on a wooden surface, with a vast ancient American landscape, lush forest and distant stepped stone temple at sunrise."],
[/batism/i,"A peaceful baptism in clear water at a quiet riverbank, two people dressed in simple white clothing, viewed from behind, sunlight reflecting softly on the water."],
[/sacrament|santa ceia/i,"Close view of simple trays holding small pieces of bread and cups of water on a white-clothed table, hands carefully preparing the emblems, soft natural window light."],
[/jejum|ora[cç][aã]o|orar/i,"A single person kneels in quiet prayer beside a bedroom window at dawn, viewed from behind, soft morning light entering a modest peaceful home."],
[/templo|ordenan[cç]as do templo/i,"A white Latter-day Saint temple exterior among landscaped gardens at sunrise, distant trees and soft clouds, peaceful uncluttered composition, no people in focus."],
[/mission[aá]ri|obra mission[aá]ria/i,"Two young missionaries wearing white shirts, ties and simple name tags walk along a sunny Brazilian neighborhood street, viewed from behind, modest homes and tropical greenery."],
[/ministra[cç][aã]o|servi[cç]o|ajudar|solidariedade/i,"Neighbors working together to help an elderly resident with a practical task in a modest garden, candid documentary-style scene in warm afternoon light."],
[/fam[ií]lia|lar|pais|filhos/i,"A family gathered around a wooden table at home, sharing a meaningful moment together, viewed from a slight distance in warm morning light."]
];
function fallback(title, content) {
 const source=(title+" "+content).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const match=FALLBACKS.find(([re])=>re.test(source));
 const scene=match?match[1]:"A small group of people helping one another with a concrete, meaningful activity in a peaceful outdoor setting, candid rear-view composition, natural warm daylight.";
 return {prompt:scene+", "+STYLE,negative_prompt:NEGATIVE};
}
function parseJson(raw){const s=String(raw||"").replace(/```json/gi,"").replace(/```/g,"").trim();const a=s.indexOf("{"),b=s.lastIndexOf("}");if(a<0||b<=a)throw new Error("Invalid JSON");return JSON.parse(s.slice(a,b+1));}
export default async function handler(req,res){
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Método não permitido."});}
 try{
  const token=String(req.headers.authorization||"").replace(/^Bearer\\s+/i,"");
  const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_ANON_KEY;
  if(!token||!url||!key)return res.status(401).json({error:"Entre no aplicativo para gerar uma imagem."});
  const auth=await fetch(url+"/auth/v1/user",{headers:{apikey:key,Authorization:"Bearer "+token}});
  if(!auth.ok)return res.status(401).json({error:"Sua sessão expirou. Entre novamente."});
  const user=await auth.json();
  const pr=await fetch(url+"/rest/v1/profiles?id=eq."+encodeURIComponent(user.id)+"&select=status",{headers:{apikey:key,Authorization:"Bearer "+token}});
  const profiles=pr.ok?await pr.json():[];
  if(!profiles.some(p=>p.status==="approved"))return res.status(403).json({error:"Somente usuários aprovados podem gerar imagens."});
  const title=String(req.body?.title||"").slice(0,240),content=String(req.body?.content||req.body?.body||"").slice(0,3000);
  if(!title&&!content)return res.status(400).json({error:"Informe o título ou o texto da publicação."});
  if(process.env.ANTHROPIC_API_KEY){
   try{
    const response=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-haiku-5-5",max_tokens:350,system:SYSTEM,messages:[{role:"user",content:"TITLE (Portuguese): "+title+"\\nTEXT (Portuguese): "+content}]})});
    if(!response.ok)throw new Error("Anthropic API error");
    const data=await response.json(),parsed=parseJson(data.content?.find(x=>x.type==="text")?.text);
    if(typeof parsed.prompt!=="string"||parsed.prompt.length<25)throw new Error("Invalid prompt");
    return res.status(200).json({prompt:parsed.prompt+", "+STYLE,negative_prompt:String(parsed.negative_prompt||"")+", "+NEGATIVE,source:"llm"});
   }catch(e){console.error("Image prompt LLM failed; using fallback:",e.message);}
  }
  return res.status(200).json({...fallback(title,content),source:"fallback"});
 }catch(e){console.error("Image prompt error:",e);return res.status(500).json({error:"Não foi possível interpretar o tema da publicação."});}
}