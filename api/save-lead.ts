import type { VercelRequest, VercelResponse } from "@vercel/node";

// Texts Brad the moment a lead comes in — best-effort, and only if Twilio is
// configured. Add TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM (your
// Twilio number) and LEAD_SMS_TO (Brad's cell) in Vercel to switch it on.
// Until then it does nothing, so the form keeps working unchanged.
async function textBrad(lead: Record<string, string | null>) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const to = process.env.LEAD_SMS_TO;
  if (!sid || !token || !from || !to) return;

  const lines = [
    "New A&B website lead:",
    lead.name && `Name: ${lead.name}`,
    lead.phone && `Phone: ${lead.phone}`,
    lead.service && `Need: ${lead.service}`,
    lead.estimate && `Estimate: ${lead.estimate}`,
    lead.address && `Address: ${lead.address}`,
    lead.message && `Note: ${lead.message}`,
  ].filter(Boolean);

  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: lines.join("\n") }).toString(),
    });
  } catch {
    // Never let a texting hiccup break lead capture.
  }
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

    // Text Brad first so he's notified even if database storage is skipped.
    await textBrad(lead);

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
