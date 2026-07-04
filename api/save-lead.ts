import type { VercelRequest, VercelResponse } from "@vercel/node";

// Texts everyone in LEAD_SMS_TO (comma-separated → notify both Brad + Serg)
// when a lead comes in. Best-effort; only runs when Twilio is configured.
// (Inlined rather than shared-imported: Vercel excludes _-prefixed api files.)
async function sendSms(body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const to = process.env.LEAD_SMS_TO;
  if (!sid || !token || !from || !to) return;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  await Promise.all(
    to.split(",").map((n) => n.trim()).filter(Boolean).map(async (num) => {
      try {
        const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ To: num, From: from, Body: body }).toString(),
        });
        const txt = await r.text();
        if (r.ok) console.log(`[sms] sent to ${num}`);
        else console.error(`[sms] failed to ${num} (${r.status}): ${txt.slice(0, 200)}`);
      } catch (e) {
        console.error(`[sms] error to ${num}:`, e);
      }
    }),
  );
}

// Saves a website lead into the Supabase `leads` table. Always returns 200 so the
// visitor's form never breaks — storage is best-effort.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const lead = {
      name: body.name || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      service: body.service || null,
      message: body.message || null,
      estimate: body.estimate || null,
    };

    // Text the team (best-effort) — even if DB storage is skipped.
    const lines = [
      "🔔 New A&B website lead",
      lead.name && `Name: ${lead.name}`,
      lead.phone && `Phone: ${lead.phone}`,
      lead.service && `Need: ${lead.service}`,
      lead.estimate && `Estimate: ${lead.estimate}`,
      lead.address && `Address: ${lead.address}`,
      lead.message && `Note: ${lead.message}`,
    ].filter(Boolean) as string[];
    await sendSms(lines.join("\n"));

    if (!url || !key) return res.status(200).json({ ok: true, stored: false });

    const r = await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(lead),
    });
    if (!r.ok) return res.status(200).json({ ok: true, stored: false, note: await r.text() });
    return res.status(200).json({ ok: true, stored: true });
  } catch (e: any) {
    return res.status(200).json({ ok: true, stored: false, error: e?.message });
  }
}
