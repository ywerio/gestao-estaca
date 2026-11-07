import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const BOOKS: Record<string, string> = {
  "1ne": "1 Néfi", "2ne": "2 Néfi", jac: "Jacó", eno: "Enos", jar: "Jarom",
  omn: "Ômni", pdm: "Palavras de Mórmon", mos: "Mosias", alm: "Alma",
  hel: "Helamã", "3ne": "3 Néfi", "4ne": "4 Néfi", mrm: "Mórmon",
  eth: "Éter", mor: "Morôni",
};

function localParts(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] || char);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const cronSecret = Deno.env.get("READING_EMAIL_CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const appsScriptUrl = Deno.env.get("READING_EMAIL_APPS_SCRIPT_URL");
  const appsScriptToken = Deno.env.get("READING_EMAIL_APPS_SCRIPT_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  let serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) {
    try {
      const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
      serviceKey = keys.default || Object.values(keys)[0] as string;
    } catch { /* no secret key available */ }
  }
  if (!appsScriptUrl || !appsScriptToken || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Google Apps Script or Supabase service secrets are not configured." }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });


  // Mantém a logo em um bucket público do Supabase para que o Gmail consiga carregá-la sem autenticação.
  const { data: existingLogo } = await admin.storage.from("email-assets").download("logo-estaca-email.png");
  if (!existingLogo) {
    const logoBytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAZAAAAEAAgMAAADgt8gcAAAADFBMVEX+/v4hSD5RcGgyVk3ZOnkbAAAH7ElEQVR42u2cf4xUVxXHP+/H7s4sUiYWkk3cwiJLpYBmLCzU2IankggNphPlARrUianBCDUTA6ZGLDdtk6rxj02wif7lGJtIHTnBbmFhSQ31bTZqGFSaVXbcRwrSIRRfiIL+Gsu9d/3hvfuzu25lZ1reuw/3+M2/uvHu/95wz59xz7rszoKCgoKCgoKCgoKCgoKCgoDB/Yd55V30u5nc3kugtI8nylpHknrkgid05idH0nbevzYEkJeXxKqxERrJMzG9Jml9Uv9EzvyVpHo41vyVpPkAWKKiw0jokzcNyWsYZsy0SIHVnoEVsopOIXhKtZTzeU7FrHpL0tIgk+iwKlPkWVt4XvSSxufH4ObCJOd+dcQZLqNkizsimOZhNm3M6epL2ubDJg3REL0liVqlEk+jHcKLmOHROSmlFbJPB5ZqmtYgzKpKWImnua6kfcSwgf386QkkkFkCyGKW8rvRxLsrIUtaSbkWorsLsKqGW8hPZnDXvME81JJjog42rmyV2cDE2Y5KYKYQJTmOSMQfjeNcqmPm3S8oZ2ORjW/rEbAyfauIm49nh3+y6k7qxLSBZJBvAhZ985udP9QmWyZmiGFQEP2sY9qx471jM+GI3gzNe5zub95PDe2K4I084UTpj/P6twNCeM1GS3Lu/H/BefqKh4Q3RmGQ0tOfCPasBeOtfBxuRrEg1JDFeDu154tvZwPN/0cAq+qPhZYwustX6IDTfXfj9SuuZh+uTLIJJq2enLiYVHZ3FsAX2hNlbvvzwK/fVNcvbCTY2UJeeZH/I7IZfqFzf/M5IPY6F/fDXdH11xSE+9Yb3ancJjL31PPfHABumqGuCJCvg5pQ423G0diVxh3bUcaeLAH9y6qrrjyFfYv3JNyYa6I3pRblXALgH66nLcJh6SuFDNyY3/GVaRwxEiDt11LXAAq5PFFb/yNcnDfWWl5mG5KOBqm+O1lFXJ4CbnOjB8ezksR56dxpB1pavDojpSVYBMMHdjORXpgx29alwUVZUpnM1My1JoMqzE6r3jpBV/aF3Q6Pgo9NukWgYn40469prgV62dFmlNXPXT4R2e3ggpPGesOTZD/46OJMS3hp44VuCl8IinBeWPANS1YxRkejDhehJDosDImoSzZkuy/gvkvQauV/LqEkGVuG+6syO5Pldfviyfb337YCVO2tve05AqcbR47YDC3cCDGdg5Q4Ao9oYQqKteclf2nIJAH3NUYcTuZrYIBcDNy5WG9blRuH8i2lYtOa38PGjFrAidxDOv1gMJzEsf23v9bOVeNYtGv1ejaHNPOCOVxteYB9GnlF4gLNCy7p54AecwsizLZxkvZ+TGRYS4BZ8LyYYqt7WYwG8Vo16BVywGIIncZ0F0A30UxJY5AGwbdu27RSUn1gEc/YCT+gdZQhor848IQCW/bMSDS307z4LHeP0Q3oICqBbjuvEr3GzXGeC/1Tal6Qfzvh5lxTARYjFCG72M0OAYIpBN9cCboCATDd4fl9RKsfjNtu2bb9q9iXp8Q8H6uAFq4m3dDQkjlfOE3XcABG7VlPj35qcFsocoC0K9ZPw2OHU+7B2+SjMOgrHovX4O46Nd+uipUgUiSJpARIzspE1G+B30ZLczlWW3+hI/A3r2wORkizIAvRHS3LBrqx20ZHUSySUMyoSRaJIZkuiHZLyp1L+WY7Jf0jpbpKb5OtSXj4l5TU53fbAl69K6W4ak/KalL+X8rHXpfz3mBw/JOW5K1KOS7lJynVSSjl+SroWJgxa/DKH98Da051Z0IwvaasFCAE7jGm2B176Qha0dQJGnj6SY+vnBHz1Smc2x/I+ASMirfEtDYg/lzGOA3q59igfQbRqRvtD8LodgIXBR6uyIcQTTjBasBlAS6CL/3fD69UCMDqSuJRS3og4JVqTA3CSkUqSrO4vRCdJzcMcDaO8g1IKynRRU097+oQeq+uU2qXaKr92jEFLh0HNR5//YrytVWAOBRdBn0/47x65ok1FV+2b2jFAQ78YuPXiS5M2UED75PEgHfTbcsGdYZv1bbdr3uST1TGGhYk3OXQIZ6objeVmZhBRnYUUKCgoKCgoKNwl0GyxJLPEFn0wnNFSYO9ss7HTbTbDlv10SrO0FCzZrdkO22nbvTK1GDSrnb5d2OkltrVydxMkDqkBPc19jpFxtFGIO22QGW3D+KazQd+uWdoodPdpn0rp+1m8VnMCkl0byYyS4szKJkoHh0TKK3BdtKes2OPBP2EUN4N30vL4IMQeh/E8rtDexKz8KMW4eJLiZuBHf3OaqU8SAK9iWniVZ6TlwxKnqDQ63qdrUmkPU1ACI18SjUks9gFkkyWQ75RbYyC7AFMg3wFzOVixg3yg/HkPomQRCz+3PJXkeT7vAMU0sNQ/W2mTWI/NI8B7Dks1uLUBI2uWxEgmSGOTAIn14UNObdnLyYHyPwAU24MU+EKRHPstcJMU26HjBO9PlXCu7gvS2DzAhaKvuGYM76bBu/5DQNsS6HcpwM0kkEbbIhj/O5fo2Q67gl4FRMxZCug9MyhM9x4zBc/8KsjwL1ey9G3lRk0sOtpTO9C4uJwENxFrxvD6a1mIWYlSIXus8oDxCGjP5HXo4hgCswuvv+AVB75W7uZ2PQhHgH3dVhOGF4dTMM55ecChbHi6sfU3rWWCPGhwayNsMxEXTvf2a/5Owtnl/vPyrRtV2FRQUFBQUFBQ+B/hP0a/oaGmRD2EAAAAAElFTkSuQmC"), (char) => char.charCodeAt(0));
    const { error: logoUploadError } = await admin.storage.from("email-assets").upload("logo-estaca-email.png", logoBytes, {
      contentType: "image/png", cacheControl: "31536000", upsert: true,
    });
    if (logoUploadError) console.error("Não foi possível publicar a logo do e-mail:", logoUploadError.message);
  }

  const { data: preferences, error: prefError } = await admin
    .from("reading_email_reminders")
    .select("user_id,reminder_time,timezone")
    .eq("enabled", true);
  if (prefError) return new Response(JSON.stringify({ error: prefError.message }), {
    status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  let sent = 0, skipped = 0, failed = 0;
  for (const pref of preferences || []) {
    const timezone = pref.timezone || "America/Fortaleza";
    let local;
    try { local = localParts(timezone); } catch { skipped++; continue; }
    if (local.time !== String(pref.reminder_time || "20:00").slice(0, 5)) { skipped++; continue; }

    const { data: profile } = await admin.from("profiles")
      .select("email,full_name,status")
      .eq("id", pref.user_id).maybeSingle();
    if (!profile?.email || profile.status !== "approved") { skipped++; continue; }

    const { data: activity, error: activityError } = await admin.from("reading_activity")
      .select("book_key,chapter,occurred_at")
      .eq("user_id", pref.user_id).eq("action", "read")
      .gte("occurred_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order("occurred_at", { ascending: false }).limit(100);
    if (activityError) { failed++; continue; }

    const todaysReading = (activity || []).filter((item) => {
      try {
        return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" })
          .format(new Date(item.occurred_at)) === local.date;
      } catch { return false; }
    });
    if (todaysReading.length) { skipped++; continue; }

    const { data: existing } = await admin.from("reading_email_reminder_log")
      .select("status,sent_at,attempts")
      .eq("user_id", pref.user_id).eq("reminder_date", local.date).maybeSingle();
    if (existing?.status === "sent") { skipped++; continue; }
    if (existing?.status === "processing" && Date.now() - new Date(existing.sent_at).getTime() < 10 * 60 * 1000) { skipped++; continue; }

    const logRow = {
      user_id: pref.user_id, reminder_date: local.date, sent_at: new Date().toISOString(),
      status: "processing", attempts: (existing?.attempts || 0) + 1, last_error: null,
    };
    let claimError = null;
    if (existing) {
      const result = await admin.from("reading_email_reminder_log").update(logRow)
        .eq("user_id", pref.user_id).eq("reminder_date", local.date);
      claimError = result.error;
    } else {
      const result = await admin.from("reading_email_reminder_log").insert(logRow);
      claimError = result.error;
    }
    if (claimError) { skipped++; continue; }

    const last = activity?.[0];
    const lastChapter = last ? `${BOOKS[last.book_key] || last.book_key} ${last.chapter}` : null;
    const rawFirstName = (profile.full_name || "").trim().split(/\s+/)[0];
    const firstName = rawFirstName && !/^(administrador|admin|usuário|usuario|user|teste)$/i.test(rawFirstName) ? rawFirstName : "";
    const greeting = firstName ? `Olá, ${escapeHtml(firstName)}!` : "Olá!";
    const chapterLine = lastChapter
      ? `Seu último capítulo marcado foi <strong>${escapeHtml(lastChapter)}</strong>.`
      : "Ainda não encontramos um capítulo marcado no seu histórico.";
    const subject = `Seu momento de leitura do Livro de Mórmon — ${local.date.split("-").reverse().join("/")}`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#263b2e;line-height:1.6"><h2 style="color:#2e7d32">Sua leitura de hoje ainda não foi registrada</h2><p>${greeting}</p><p>Você ainda não registrou sua leitura do Livro de Mórmon hoje. ${chapterLine}</p><p>Que tal reservar alguns minutos para continuar sua jornada e avançar na meta que escolheu?</p><p style="margin-top:28px;color:#66756b;font-size:13px">Gestão Estaca Horto · Um capítulo de cada vez.</p><div style="margin-top:30px;padding-top:18px;border-top:1px solid #e5ebe7;text-align:center"><img src="https://chreuquzifrooazebcyq.supabase.co/storage/v1/object/public/email-assets/logo-estaca-email.png" alt="Estaca Teresina Brasil Horto" width="190" style="display:block;width:190px;max-width:75%;height:auto;margin:0 auto;border:0" /><p style="margin:10px 0 0;color:#7b8981;font-size:11px;letter-spacing:.4px">ESTACA TERESINA BRASIL HORTO</p><p style="margin:18px 0 0;color:#8a948e;font-size:10px;line-height:1.45">Este endereço é utilizado exclusivamente para envios automáticos do aplicativo. Por favor, não responda a este e-mail.</p></div></div>`;
    const plain = `${firstName ? `Olá, ${firstName}!` : "Olá!"}\n\nVocê ainda não registrou sua leitura do Livro de Mórmon hoje. ${lastChapter ? `Seu último capítulo marcado foi ${lastChapter}.` : "Ainda não encontramos um capítulo marcado no seu histórico."}\n\nQue tal reservar alguns minutos para continuar sua jornada e avançar na meta que escolheu?\n\nGestão Estaca Horto`;

    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: appsScriptToken,
          to: profile.email,
          subject,
          html,
          text: plain,
        }),
        redirect: "follow",
      });
      const responseText = await response.text();
      let result: Record<string, unknown> = {};
      try { result = JSON.parse(responseText); } catch { /* invalid response */ }
      if (!response.ok || result.success !== true) {
        throw new Error(String(result.error || `Google Apps Script HTTP ${response.status}: ${responseText.slice(0, 250)}`));
      }
      await admin.from("reading_email_reminder_log").update({
        status: "sent", sent_at: new Date().toISOString(), provider_message_id: null, last_error: null,
      }).eq("user_id", pref.user_id).eq("reminder_date", local.date);
      sent++;
    } catch (error) {
      await admin.from("reading_email_reminder_log").update({
        status: "failed", last_error: String(error).slice(0, 500),
      }).eq("user_id", pref.user_id).eq("reminder_date", local.date);
      failed++;
    }
  }

  return new Response(JSON.stringify({ sent, skipped, failed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
