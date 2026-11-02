const STYLE = "soft painterly editorial illustration, warm natural light, reverent peaceful mood, gentle natural colors, cinematic composition, clear visual storytelling";
const NEGATIVE = "cross, christian cross, latin cross, crucifix, crucifixion, cross necklace, cross pendant, cross jewelry, cross-shaped object, cross on a building, cross on a church, cross in the background, religious cross symbol, stained glass depicting a cross, church steeple cross, altar cross, text, letters, watermark, logo, deformed face, malformed hands, extra fingers, distorted anatomy, duplicate people, cartoon, anime";

const SCENES = [
  // Temas específicos vêm primeiro para evitar que palavras genéricas, como "família" ou "templo", prevaleçam.
  { theme: "História da Família", patterns: [/historia da familia/, /arvore genealogica/, /genealogia/, /pesquisa de antepassados/, /familysearch/], scene: "A meaningful family history scene with an open family album, old family photographs and handwritten genealogy records arranged on a wooden table, warm natural light, suggesting discovery across generations." },
  { theme: "Indexação", patterns: [/indexacao/, /indexar registros/, /registros historicos/, /voluntarios do familysearch/, /digitacao de registros genealogicos/], scene: "A volunteer carefully reviewing digitized historical family records on a computer, with archival documents and handwritten names nearby, a calm home workspace, no readable text on screen." },
  { theme: "Trabalho do Templo", patterns: [/trabalho do templo/, /obra do templo/, /batismo pelos mortos/, /ordenancas vicarias/, /obra vicaria/, /ordenancas por antepassados/], scene: "A reverent Latter-day Saint temple scene with a beautiful temple exterior at sunrise and a person holding a family name card, emphasizing sacred service for ancestors. Temple architecture must have no cross or crucifix." },
  { theme: "Antepassados e Gerações", patterns: [/antepassados/, /ancestrais/, /meus antepassados/, /nossos antepassados/, /geracoes passadas/, /honrar os antepassados/], scene: "Several generations represented through a carefully arranged collection of family portraits, from elderly ancestors to descendants, connected by a warm sense of heritage and belonging." },
  { theme: "Nova Geração", patterns: [/nova geracao/, /futura geracao/, /geracao de hoje/, /criar os filhos na fe/, /preparar os jovens/, /criancas e jovens/], scene: "Latter-day Saint children and youth learning, serving and supporting one another in a bright welcoming setting, hopeful and uplifting documentary-style composition." },
  { theme: "Famílias Eternas", patterns: [/familias eternas/, /familia eterna/, /selamento familiar/, /lacos eternos/, /unidos para sempre/], scene: "A loving multigenerational family together in a peaceful temple garden, grandparents, parents and children sharing a tender moment, symbolizing eternal family bonds. No crosses or crucifixes." },
  { theme: "Caminho do Convênio", patterns: [/caminho do convenio/, /trilhar o caminho/, /trilhar o caminho do convenio/, /permanecer no caminho do convenio/, /convenios e ordenancas/], scene: "A person walking along a sunlit path toward a beautiful Latter-day Saint temple in the distance, symbolic of faithfully keeping covenants and following Jesus Christ. No crosses or crucifixes anywhere." },
  { theme: "Dia do Senhor", patterns: [/dia do senhor/, /santificar o domingo/, /domingo como dia santo/, /dia de descanso/, /guardar o domingo/], scene: "A peaceful Sunday morning scene with a family preparing to attend worship, scriptures and a simple white shirt laid out, gentle light entering the home." },
  { theme: "Fé em Jesus Cristo", patterns: [/fe em jesus cristo/, /fe no salvador/, /confiar no senhor/, /confianca em cristo/, /acreditar em jesus/], scene: "A person looking toward a calm sunrise over a mountain path, conveying trust in Jesus Christ, faith and spiritual hope, reverent natural atmosphere." },
  { theme: "Perseverança", patterns: [/perseveranca/, /perseverar ate o fim/, /permanecer firme/, /constancia na fe/, /nao desistir/], scene: "A lone hiker steadily climbing a mountain trail toward warm morning light, conveying resilience, faith and steady progress." },
  { theme: "Humildade", patterns: [/humildade/, /coracao humilde/, /orgulho/, /ser humilde/], scene: "A quiet act of humble service, a person kneeling to help another person with a practical need, gentle natural light and sincere expressions." },
  { theme: "Mansidão", patterns: [/mansidao/, /mansos/, /ser manso/, /brandura/, /paciencia e mansidao/], scene: "A calm, compassionate interaction between two people listening carefully to one another in a peaceful garden, conveying gentleness and self-control." },
  { theme: "Pacificadores", patterns: [/pacificadores/, /promover a paz/, /reconciliacao/, /evitar contendas/, /resolver conflitos/, /unidade e paz/], scene: "Two people reconciling with a sincere handshake while friends and family gather peacefully nearby, conveying forgiveness, unity and peacemaking." },
  { theme: "Profetas e Apóstolos", patterns: [/profetas/, /apostolos/, /seguir o profeta/, /profeta vivo/, /revelacao moderna/, /autoridades gerais/], scene: "A reverent scene of a congregation listening attentively to a church leader speaking from a simple pulpit in a bright meeting hall, no visible religious symbols or crosses." },
  { theme: "Apoio aos Líderes", patterns: [/apoio aos lideres/, /sustentar os lideres/, /apoiar as autoridades/, /chamados na igreja/, /lideres da igreja/, /servir em um chamado/], scene: "Members of a congregation standing together in a supportive sustaining vote, hands raised respectfully in a bright meetinghouse, warm and unified atmosphere." },
  { theme: "Arrependimento", patterns: [/arrependimento/, /arrepender/, /mudanca de coracao/, /confessar e abandonar/, /perdao dos pecados/], scene: "A solitary person reflecting beside a window at dawn, an open set of scriptures nearby, conveying sincere reflection, repentance and a hopeful new beginning." },
  { theme: "Expiação de Jesus Cristo", patterns: [/expiacao/, /sacrificio do salvador/, /graca de jesus/, /misericordia de cristo/, /redencao/], scene: "A reverent symbolic scene of a quiet olive garden at twilight with a distant solitary figure in white, conveying the love and redeeming sacrifice of Jesus Christ, without depicting a cross." },
  { theme: "Espírito Santo", patterns: [/espirito santo/, /revelacao pessoal/, /inspiracao espiritual/, /consolo espiritual/, /ouvir o espirito/], scene: "A person quietly studying scriptures beside a window as gentle morning light fills the room, conveying spiritual guidance, peace and personal revelation." },
  { theme: "Escrituras", patterns: [/escrituras/, /estudo das escrituras/, /palavra de deus/, /ler o livro de mormon/, /estudo do evangelho/], scene: "An open set of scriptures on a wooden table beside a notebook and soft morning window light, inviting daily study and reflection, no readable text." },
  { theme: "Jejum e oração", patterns: [/jejum/, /oracao/, /orar/, /dia de jejum/], scene: "A single person kneels in quiet prayer beside a bedroom window at dawn, viewed from behind, soft morning light entering a modest peaceful home." },
  { theme: "Dízimo e Ofertas", patterns: [/dizimo/, /ofertas de jejum/, /oferta de jejum/, /lei do dizimo/, /contribuicoes/], scene: "A person thoughtfully preparing a small donation envelope beside scriptures at home, conveying faith, generosity and trust in God, no readable text." },
  { theme: "Ministração", patterns: [/ministracao/, /ministrar/, /cuidar uns dos outros/, /designacao de ministracao/, /necessidades dos membros/], scene: "Two friends visiting and sincerely listening to an individual at home, offering companionship and practical help, warm natural light." },
  { theme: "Obra Missionária", patterns: [/obra missionaria/, /missionari/, /compartilhar o evangelho/, /pregar o evangelho/, /convidar a cristo/], scene: "Two young missionaries in white shirts and ties speaking kindly with a family at their doorway on a sunny Brazilian neighborhood street, viewed naturally." },
  { theme: "Batismo", patterns: [/batismo/, /batizar/], scene: "A peaceful baptism in clear water at a quiet riverbank, two people dressed in simple white clothing, viewed from behind, sunlight reflecting softly on the water." },
  { theme: "Sacramento", patterns: [/sacrament/, /santa ceia/], scene: "Close view of simple trays holding small pieces of bread and cups of water on a white-clothed table, hands carefully preparing the emblems, soft natural window light." },
  { theme: "Templo", patterns: [/templo/, /ordenancas do templo/], scene: "A beautiful white Latter-day Saint temple exterior among landscaped gardens at sunrise, distant trees and soft clouds, peaceful uncluttered composition. No cross or crucifix on the building or anywhere in the scene." },
  { theme: "Primeira Visão", patterns: [/primeira visao/, /bosque sagrado/, /joseph smith/], scene: "Spring 1820 in upstate New York. A 14-year-old farm boy in simple 1820s rural clothing kneels in prayer, seen from behind, in a quiet grove of tall trees. A brilliant vertical pillar of heavenly light descends through the canopy and illuminates the forest clearing." },
  { theme: "Livro de Mórmon", patterns: [/livro de mormon/], scene: "An open copy of an ancient scripture rests in the foreground, with a lush ancient American landscape and a distant stepped stone structure at sunrise." },
  { theme: "Conferência Geral", patterns: [/conferencia geral/, /conferencia da igreja/], scene: "The exterior of a grand modern conference center at sunrise, people arriving in small family groups seen from a distance, landscaped grounds and glass architecture, welcoming reverent atmosphere. No crosses or crucifixes." },
  { theme: "Juventude", patterns: [/juventude/, /jovens/, /rapazes/, /mocas/, /seminario/, /instituto/], scene: "A diverse group of teenagers and young adults participating in a positive outdoor activity together, modest everyday clothing, green park setting, candid documentary-style composition." },
  { theme: "Serviço", patterns: [/servico/, /ajudar/, /solidariedade/, /maos que ajudam/, /caridade/, /amor ao proximo/], scene: "Neighbors working together on a practical act of service in a modest garden, carrying supplies and helping one another, candid documentary-style scene in warm afternoon light." },
  { theme: "Família", patterns: [/familia/, /lar/, /pais/, /filhos/], scene: "A family gathered around a wooden table at home, sharing a meaningful activity, viewed naturally from a slight distance in warm morning light." },
  { theme: "Casamento Eterno", patterns: [/casamento eterno/, /casamento no templo/, /selamento/, /companheiros eternos/], scene: "A joyful couple in modest formal clothing standing in a beautiful temple garden with family members, celebrating marriage and eternal commitment. No crosses or crucifixes." },
  { theme: "Identidade Divina", patterns: [/identidade divina/, /filhos de deus/, /valor individual/, /filha de deus/, /filho de deus/], scene: "A diverse group of individuals of different ages standing in a sunlit natural setting, each shown with dignity and belonging, conveying divine worth and identity." },
  { theme: "Gratidão", patterns: [/gratidao/, /agradecer/, /bencaos/, /reconhecer as bencaos/], scene: "A family sharing a quiet moment of gratitude around a dinner table, warm evening light and sincere expressions." },
  { theme: "Esperança", patterns: [/esperanca/, /consolo/, /vencer dificuldades/, /dias melhores/], scene: "Golden sunrise breaking through clouds over a peaceful landscape, a person standing on a path looking toward the light, conveying hope in Christ." },
  { theme: "Obediência", patterns: [/obediencia/, /mandamentos/, /vontade de deus/, /guardar os mandamentos/], scene: "A person choosing a bright peaceful path through a green landscape, conveying faithful commitment and willingness to follow God's commandments." },
  { theme: "Virtudes Cristãs", patterns: [/virtude/, /integridade/, /honestidade/, /temperanca/, /carater de cristo/], scene: "A quiet everyday scene of a person acting with honesty and kindness, helping someone return a misplaced item, warm natural documentary style." },
  { theme: "Segunda Vinda", patterns: [/segunda vinda/, /retorno do salvador/, /volta de jesus/, /preparacao para a vinda/], scene: "A majestic sunrise illuminating the clouds above a peaceful landscape, conveying reverent anticipation and hope in the return of Jesus Christ, no cross imagery." },
  { theme: "Ressurreição", patterns: [/ressurreicao/], scene: "An empty garden tomb at early dawn, a large stone rolled away, warm golden sunlight illuminating the entrance, peaceful hopeful atmosphere." },
  { theme: "Páscoa", patterns: [/pascoa/, /semana santa/, /ultima ceia/], scene: "A symbolic Easter scene at dawn: an empty garden tomb with its large stone rolled away, warm golden sunrise illuminating the entrance, olive trees and flowers, peaceful atmosphere of hope and resurrection." },
  { theme: "Natal", patterns: [/natal/, /nascimento de jesus/, /nascimento do salvador/], scene: "A reverent nativity scene in a humble stable in Bethlehem at night, Mary and Joseph beside the newborn Jesus in a manger, a bright star above, warm lantern light." },
  { theme: "Restauração", patterns: [/restauracao do evangelho/, /restauracao da igreja/, /restauracao/], scene: "A solitary early nineteenth-century young man studying an open Bible beside a wooden table near a window, morning light illuminating the pages, historically accurate rural American home." },
  { theme: "Criação e Natureza", patterns: [/criacao/, /natureza/, /mundo/], scene: "A majestic natural landscape at sunrise, mountains, water, trees and clouds illuminated by the first golden light, conveying the beauty of creation." }
];

function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function scoreScene(text, weight) {
  const normalized = normalize(text);
  if (!normalized.trim()) return [];
  return SCENES.map(item => ({
    ...item,
    score: item.patterns.reduce((sum, pattern) => sum + (pattern.test(normalized) ? weight : 0), 0)
  })).filter(item => item.score > 0);
}

function makePrompt(title, content) {
  const titleScores = scoreScene(title, 5);
  const contentScores = scoreScene(String(content || "").slice(0, 400), 1);
  const scores = new Map();
  for (const item of titleScores) scores.set(item.theme, { ...item, source: "title" });
  for (const item of contentScores) {
    const previous = scores.get(item.theme);
    if (previous) previous.score += item.score;
    else scores.set(item.theme, { ...item, source: "content" });
  }
  const ranked = [...scores.values()].sort((a, b) =>
    b.score - a.score || (a.source === "title" ? -1 : 1)
  );
  const selected = ranked[0] || null;
  const scene = selected
    ? selected.scene
    : "A quiet path through a beautiful green landscape at sunrise, soft golden light filtering through trees, peaceful and hopeful atmosphere, no buildings, no crowd, no religious symbols.";
  const theme = selected?.theme || "Natureza (tema neutro)";
  console.log("[image-prompt] tema escolhido:", theme, "pontuação:", selected?.score || 0, "origem:", selected?.source || "fallback");
  return {
    prompt: scene + " " + STYLE + " IMPORTANT: Do not show any cross or crucifix anywhere in the image, including foreground, background, buildings, clothing, jewelry, or decorative objects. Do not use a cross as a religious symbol. Represent faith only through the actual scene and its appropriate details.",
    negative_prompt: NEGATIVE,
    theme,
    score: selected?.score || 0,
    source: selected?.source || "neutral-fallback"
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
    if (!token || !supabaseUrl || !anonKey) return res.status(401).json({ error: "Entre no aplicativo para gerar uma imagem." });
    const auth = await fetch(supabaseUrl + "/auth/v1/user", { headers: { apikey: anonKey, Authorization: "Bearer " + token } });
    if (!auth.ok) return res.status(401).json({ error: "Sua sessão expirou. Entre novamente." });
    const user = await auth.json();
    const profileRes = await fetch(supabaseUrl + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=status", {
      headers: { apikey: anonKey, Authorization: "Bearer " + token }
    });
    const profiles = profileRes.ok ? await profileRes.json() : [];
    if (!profiles.some(profile => profile.status === "approved")) return res.status(403).json({ error: "Somente usuários aprovados podem gerar imagens." });
    const title = String(req.body?.title || "").slice(0, 240);
    const content = String(req.body?.content || req.body?.body || "").slice(0, 3000);
    if (!title.trim() && !content.trim()) return res.status(400).json({ error: "Informe o título ou o texto da publicação." });
    return res.status(200).json(makePrompt(title, content));
  } catch (error) {
    console.error("Image prompt interpretation error:", error);
    return res.status(500).json({ error: "Não foi possível interpretar o tema da publicação. Tente novamente." });
  }
}
