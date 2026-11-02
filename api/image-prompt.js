const STYLE = "soft painterly editorial illustration, warm natural light, reverent peaceful mood, gentle natural colors, cinematic composition, clear visual storytelling";
const NEGATIVE = "cross, crucifix, stained glass, church interior, crowded congregation, pews, priest robes, text, letters, watermark, logo, deformed face, malformed hands, extra fingers, distorted anatomy, duplicate people, cartoon, anime";

// Keep specific subjects before broader subjects. Matching is accent-insensitive.
const SCENES = [
  [/primeira visao|bosque sagrado|joseph smith/, "Spring 1820 in upstate New York. A 14-year-old farm boy in simple 1820s rural clothing kneels in prayer, seen from behind, in a quiet grove of tall trees. A brilliant vertical pillar of heavenly light descends through the canopy and illuminates the forest clearing. The woodland and kneeling boy are the unmistakable central subject."],
  [/livro de mormon/, "An open copy of an ancient scripture rests in the foreground, with a lush ancient American landscape and a distant stepped stone structure at sunrise. The book and ancient setting are the clear central subject."],
  [/batismo|batizar/, "A peaceful baptism in clear water at a quiet riverbank, two people dressed in simple white clothing, viewed from behind, sunlight reflecting softly on the water. The water and baptism are the central subject."],
  [/sacrament|santa ceia/, "Close view of simple trays holding small pieces of bread and cups of water on a white-clothed table, hands carefully preparing the emblems, soft natural window light. No people or congregation in view."],
  [/jejum|oracao|orar/, "A single person kneels in quiet prayer beside a bedroom window at dawn, viewed from behind, soft morning light entering a modest peaceful home."],
  [/templo|ordenancas do templo/, "A white Latter-day Saint temple exterior among landscaped gardens at sunrise, distant trees and soft clouds, peaceful uncluttered composition, no people in focus."],
  [/missionari|obra missionaria/, "Two young missionaries wearing white shirts, ties and simple name tags walk along a sunny Brazilian neighborhood street, viewed from behind, modest homes and tropical greenery."],
  [/natal|nascimento de jesus|nascimento do salvador/, "A reverent nativity scene in a humble stable in Bethlehem at night, Mary and Joseph beside the newborn Jesus in a manger, a bright star above, warm lantern light, historically inspired clothing, peaceful intimate composition."],
  [/pascoa|semana santa|ultima ceia/, "A symbolic Easter scene at dawn: an empty garden tomb with its large stone rolled away, warm golden sunrise illuminating the entrance, olive trees and flowers, peaceful atmosphere of hope and resurrection."],
  [/conferencia geral|conferencia da igreja/, "The exterior of a grand modern conference center at sunrise, people arriving in small family groups seen from a distance, landscaped grounds, flags and glass architecture, welcoming and reverent atmosphere. No readable signs or text."],
  [/juventude|jovens|rapazes|mocas|seminario|instituto/, "A diverse group of teenagers and young adults participating in a positive outdoor activity together, smiling naturally, modest everyday clothing, green park setting, candid documentary-style composition."],
  [/ministra[c]?ao|servico|ajudar|solidariedade|maos que ajudam/, "Neighbors working together on a practical act of service in a modest garden, carrying supplies and helping one another, candid documentary-style scene in warm afternoon light."],
  [/familia|lar|pais|filhos/, "A family gathered around a wooden table at home, sharing a meaningful activity, viewed naturally from a slight distance in warm morning light."],
  [/ressurreicao/, "An empty garden tomb at early dawn, a large stone rolled away, warm golden sunlight illuminating the entrance, peaceful hopeful atmosphere, no people in focus."],
  [/criacao|natureza|mundo/, "A majestic natural landscape at sunrise, mountains, water, trees and clouds illuminated by the first golden light, conveying the beauty of creation."],
  [/revelacao|profeta|restauracao do evangelho/, "A solitary early nineteenth-century young man studying an open Bible beside a wooden table near a window, morning light illuminating the pages, historically accurate rural American home."]
];

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function findScene(value) {
  const normalized = normalize(value);
  if (!normalized.trim()) return null;
  return SCENES.find(([patterns]) => patterns.some(pattern => pattern.test(normalized))) || null;
}

function makePrompt(title, content) {
  // The title is the primary subject. Body text is only a fallback when
  // no known theme is found in the title, so incidental words cannot hijack it.
  const selectedTitle = findScene(title);
  const selectedContent = selectedTitle ? null : findScene(content);
  const selected = selectedTitle || selectedContent;
  const scene = selected
    ? selected[1]
    : "A quiet path through a beautiful green landscape at sunrise, soft golden light filtering through trees, peaceful and hopeful atmosphere, no buildings, no crowd, no religious symbols.";
  return {
    prompt: scene + " " + STYLE,
    negative_prompt: NEGATIVE,
    source: selectedTitle ? "title-scene-library" : selectedContent ? "content-scene-library" : "neutral-fallback"
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
    if (!title.trim() && !content.trim()) return res.status(400).json({ error: "Informe o título ou o texto da publicação." });
    return res.status(200).json(makePrompt(title, content));
  } catch (error) {
    console.error("Image prompt error:", error);
    return res.status(500).json({ error: "Não foi possível identificar o tema. Confira os dados e tente novamente." });
  }
}
