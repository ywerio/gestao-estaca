const STYLE = "soft painterly editorial illustration, warm natural light, reverent peaceful mood, gentle natural colors, cinematic composition, clear visual storytelling";
const NEGATIVE = "cross, crucifix, stained glass, church interior, crowded congregation, pews, priest robes, text, letters, watermark, logo, deformed face, malformed hands, extra fingers, distorted anatomy, duplicate people, cartoon, anime";

const SCENES = [
  [/primeira vis[aã]o|bosque sagrado|joseph smith/i, "Spring 1820 in upstate New York. A 14-year-old farm boy in simple 1820s rural clothing kneels in prayer, seen from behind, in a quiet grove of tall trees. A brilliant vertical pillar of heavenly light descends through the canopy and illuminates the forest clearing. The woodland and kneeling boy are the unmistakable central subject."],
  [/livro de m[oó]rmon|m[oó]rmon/i, "An open copy of an ancient scripture rests in the foreground, with a lush ancient American landscape and a distant stepped stone structure at sunrise. The book and ancient setting are the clear central subject."],
  [/batism|batismo/i, "A peaceful baptism in clear water at a quiet riverbank, two people dressed in simple white clothing, viewed from behind, sunlight reflecting softly on the water. The water and baptism are the central subject."],
  [/sacrament|santa ceia/i, "Close view of simple trays holding small pieces of bread and cups of water on a white-clothed table, hands carefully preparing the emblems, soft natural window light. No people or congregation in view."],
  [/jejum|ora[cç][aã]o|orar/i, "A single person kneels in quiet prayer beside a bedroom window at dawn, viewed from behind, soft morning light entering a modest peaceful home."],
  [/templo|ordenan[cç]as do templo/i, "A white Latter-day Saint temple exterior among landscaped gardens at sunrise, distant trees and soft clouds, peaceful uncluttered composition, no people in focus."],
  [/mission[aá]ri|obra mission[aá]ria/i, "Two young missionaries wearing white shirts, ties and simple name tags walk along a sunny Brazilian neighborhood street, viewed from behind, modest homes and tropical greenery."],
  [/ministra[cç][aã]o|servi[cç]o|ajudar|solidariedade/i, "Neighbors working together on a practical act of service in a modest garden, candid documentary-style scene in warm afternoon light."],
  [/fam[ií]lia|lar|pais|filhos/i, "A family gathered around a wooden table at home, sharing a meaningful activity, viewed naturally from a slight distance in warm morning light."],
  [/ressurrei[cç][aã]o/i, "An empty garden tomb at early dawn, a large stone rolled away, warm golden sunlight illuminating the entrance, peaceful hopeful atmosphere, no people in focus."],
  [/cria[cç][aã]o|cria[cç][aã]o do mundo/i, "A majestic natural landscape at sunrise, mountains, water, trees and clouds illuminated by the first golden light, conveying the beauty of creation."],
  [/revela[cç][aã]o|profeta|restaura[cç][aã]o do evangelho/i, "A solitary early nineteenth-century young man studying an open Bible beside a wooden table near a window, morning light illuminating the pages, historically accurate rural American home."]
];

function makePrompt(title, content) {
  const source = (title + " " + content).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const selected = SCENES.find(([pattern]) => pattern.test(source));
  const scene = selected
    ? selected[1]
    : "A quiet path through a beautiful green landscape at sunrise, soft golden light filtering through trees, peaceful and hopeful atmosphere, no buildings, no crowd, no religious symbols.";
  return {
    prompt: scene + " " + STYLE,
    negative_prompt: NEGATIVE,
    source: selected ? "scene-library" : "neutral-fallback"
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    if (!token || !supabaseUrl || !anonKey) {
      return res.status(401).json({ error: "Entre no aplicativo para gerar uma imagem." });
    }
    const auth = await fetch(supabaseUrl + "/auth/v1/user", {
      headers: { apikey: anonKey, Authorization: "Bearer " + token }
    });
    if (!auth.ok) return res.status(401).json({ error: "Sua sessão expirou. Entre novamente." });
    const user = await auth.json();
    const profileRes = await fetch(
      supabaseUrl + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=status",
      { headers: { apikey: anonKey, Authorization: "Bearer " + token } }
    );
    const profiles = profileRes.ok ? await profileRes.json() : [];
    if (!profiles.some(profile => profile.status === "approved")) {
      return res.status(403).json({ error: "Somente usuários aprovados podem gerar imagens." });
    }
    const title = String(req.body?.title || "").slice(0, 240);
    const content = String(req.body?.content || req.body?.body || "").slice(0, 3000);
    if (!title && !content) return res.status(400).json({ error: "Informe o título ou o texto da publicação." });
    return res.status(200).json(makePrompt(title, content));
  } catch (error) {
    console.error("Image prompt error:", error);
    return res.status(500).json({ error: "Não foi possível identificar o tema da publicação." });
  }
}
