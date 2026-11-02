const SITE = "https://gestao-estaca.vercel.app";
const FALLBACK_IMAGE = `${SITE}/og-logo.png`;

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function safeImage(value) {
  try {
    const url = new URL(String(value || ""));
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

function genericPage(res, canonical) {
  const title = "Gestão Estaca Horto";
  const description = "Abra esta publicação no aplicativo Gestão Estaca Horto.";
  const target = `${SITE}/`;
  const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Gestão Estaca Horto">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${FALLBACK_IMAGE}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:image" content="${FALLBACK_IMAGE}">
</head><body><a href="${target}">Abrir Gestão Estaca Horto</a></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
  return res.status(200).send(html);
}

export default async function handler(req, res) {
  const rawId = String(req.query?.id || "");
  const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)
    ? rawId
    : "";
  const canonical = id ? `${SITE}/p/${id}` : `${SITE}/`;
  const target = id ? `${SITE}/?post=${encodeURIComponent(id)}#post-${encodeURIComponent(id)}` : `${SITE}/`;

  const userAgent = String(req.headers?.["user-agent"] || "");
  const isPreviewBot = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|TelegramBot|Discordbot|Slackbot|SkypeUriPreview|Googlebot|bingbot/i.test(userAgent);

  // Pessoas devem ir diretamente ao aplicativo; robôs recebem HTML com Open Graph.
  if (!isPreviewBot) return res.redirect(302, target);
  if (!id) return genericPage(res, canonical);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  let post = null;

  if (supabaseUrl && secretKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/posts?id=eq.${encodeURIComponent(id)}&published=eq.true&select=id,title,image_url,leaders_only&limit=1`;
      const response = await fetch(endpoint, {
        headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` }
      });
      if (response.ok) {
        const rows = await response.json();
        post = Array.isArray(rows) ? rows[0] || null : null;
      } else {
        console.error("Share preview lookup returned", response.status);
      }
    } catch (error) {
      console.error("Share preview lookup failed:", error);
    }
  }

  // Não expõe corpo, texto, dados de autor ou informações adicionais no cartão.
  if (!post || post.leaders_only === true) return genericPage(res, canonical);

  const title = post.title ? `${String(post.title).slice(0, 160)} · Estaca Horto` : "Estaca Teresina Brasil Horto";
  const image = safeImage(post.image_url);
  const description = "Toque para abrir esta publicação no aplicativo Gestão Estaca Horto.";
  const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Estaca Horto">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:alt" content="Imagem da publicação ou símbolo da Estaca Horto">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
</head><body>
<h1>${esc(title)}</h1>
<p><a href="${esc(target)}">Abrir publicação no Gestão Estaca Horto</a></p>
<meta http-equiv="refresh" content="0;url=${esc(target)}">
<script>location.replace(${JSON.stringify(target)})</script>
</body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).send(html);
}
