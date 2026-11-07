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
    const firstName = (profile.full_name || "").trim().split(/\s+/)[0];
    const greeting = firstName ? `Olá, ${escapeHtml(firstName)}!` : "Olá!";
    const chapterLine = lastChapter
      ? `Seu último capítulo marcado foi <strong>${escapeHtml(lastChapter)}</strong>.`
      : "Ainda não encontramos um capítulo marcado no seu histórico.";
    const subject = "Seu momento de leitura do Livro de Mórmon";
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#263b2e;line-height:1.6"><h2 style="color:#2e7d32">Sua leitura de hoje ainda não foi registrada</h2><p>${greeting}</p><p>Você ainda não registrou sua leitura do Livro de Mórmon hoje. ${chapterLine}</p><p>Que tal reservar alguns minutos para continuar sua jornada e avançar na meta que escolheu?</p><p style="margin-top:28px;color:#66756b;font-size:13px">Gestão Estaca Horto · Um capítulo de cada vez.</p></div>`;
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
