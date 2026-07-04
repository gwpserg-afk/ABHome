import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendSms } from "./_twilio";

// Texts the team the moment a lead comes in — best-effort, and only if Twilio
// is configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM +
// LEAD_SMS_TO, which can be a comma-separated list to notify both Brad + Serg).
async function notifyLead(lead: Record<string, string | null>) {
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

    // Text the team first so they're notified even if DB storage is skipped.
    await notifyLead(lead);

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
