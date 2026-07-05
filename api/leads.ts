import type { VercelRequest, VercelResponse } from "@vercel/node";

// Returns website leads for the admin dashboard. Password-protected: the caller must
// send the correct x-admin-key header (compared against ADMIN_PASSWORD env var).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminPass = process.env.ADMIN_PASSWORD || "";
  const provided = (req.headers["x-admin-key"] as string) || "";

  // No password set on the server = admin is locked until it's configured.
  if (!adminPass) return res.status(503).json({ error: "Admin is not configured yet." });
  if (provided !== adminPass) return res.status(401).json({ error: "Wrong password." });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(200).json({ leads: [], configured: false });

  try {
    // Delete a lead by id (used to clear test data from the dashboard).
    if (req.method === "DELETE") {
      const id = (req.query.id as string) || "";
      if (!id) return res.status(400).json({ error: "Missing id" });
      await fetch(`${url}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      return res.status(200).json({ ok: true });
    }

    const r = await fetch(`${url}/rest/v1/leads?select=*&order=created_at.desc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const leads = await r.json();
    return res.status(200).json({ leads: Array.isArray(leads) ? leads : [], configured: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Could not load leads." });
  }
}
