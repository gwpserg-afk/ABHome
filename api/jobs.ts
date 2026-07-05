import type { VercelRequest, VercelResponse } from "@vercel/node";

// Owner's job / expense tracker. Admin-key protected. Backed by a Supabase
// `jobs` table (run this once in the Supabase SQL editor):
//   create table if not exists jobs (
//     id uuid primary key default gen_random_uuid(),
//     name text, service text,
//     cost numeric default 0, revenue numeric default 0,
//     status text default 'Open',
//     created_at timestamptz default now()
//   );
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminPass = process.env.ADMIN_PASSWORD || "";
  const provided = (req.headers["x-admin-key"] as string) || "";
  if (!adminPass) return res.status(503).json({ error: "Admin is not configured yet." });
  if (provided !== adminPass) return res.status(401).json({ error: "Wrong password." });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(200).json({ jobs: [], configured: false });
  const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  try {
    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const job = {
        name: b.name || null,
        service: b.service || null,
        cost: Number(b.cost) || 0,
        revenue: Number(b.revenue) || 0,
        status: b.status || "Open",
      };
      const r = await fetch(`${url}/rest/v1/jobs`, {
        method: "POST",
        headers: { ...H, Prefer: "return=representation" },
        body: JSON.stringify(job),
      });
      const data = await r.json();
      if (!r.ok) return res.status(200).json({ ok: false, error: (data && data.message) || "Could not save." });
      return res.status(200).json({ ok: true, job: Array.isArray(data) ? data[0] : data });
    }

    if (req.method === "DELETE") {
      const id = (req.query.id as string) || "";
      if (!id) return res.status(400).json({ error: "Missing id" });
      await fetch(`${url}/rest/v1/jobs?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: H });
      return res.status(200).json({ ok: true });
    }

    const r = await fetch(`${url}/rest/v1/jobs?select=*&order=created_at.desc`, { headers: H });
    const jobs = await r.json();
    return res.status(200).json({ jobs: Array.isArray(jobs) ? jobs : [], configured: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Jobs error." });
  }
}
