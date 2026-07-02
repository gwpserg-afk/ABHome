import type { VercelRequest, VercelResponse } from "@vercel/node";

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
