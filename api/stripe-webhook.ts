import type { VercelRequest, VercelResponse } from "@vercel/node";

// Texts everyone in LEAD_SMS_TO on a successful payment. Best-effort.
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
        if (!r.ok) console.error(`[sms] failed to ${num} (${r.status}): ${(await r.text()).slice(0, 200)}`);
        else console.log(`[sms] sent to ${num}`);
      } catch (e) {
        console.error(`[sms] error to ${num}:`, e);
      }
    }),
  );
}

// Texts the team when a customer pays. To turn on:
//  1) Stripe → Developers → Webhooks → Add endpoint:
//       https://www.abroofingmi.com/api/stripe-webhook?token=YOUR_SECRET
//     Events: checkout.session.completed (and payment_intent.succeeded).
//  2) Vercel (ab-home) → add STRIPE_WEBHOOK_TOKEN = the same YOUR_SECRET.
// Always returns 200 so Stripe never retry-storms.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.STRIPE_WEBHOOK_TOKEN;
  if (!token || req.query.token !== token) return res.status(401).json({ error: "unauthorized" });

  try {
    const evt = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    if (evt.type === "checkout.session.completed" || evt.type === "payment_intent.succeeded") {
      const obj = evt.data?.object ?? {};
      const cents = obj.amount_total ?? obj.amount_received ?? obj.amount ?? 0;
      const dollars = (Number(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const who = obj.customer_details?.email || obj.customer_email || obj.receipt_email || "a customer";
      const desc = obj.description ? ` — ${obj.description}` : "";
      await sendSms(`💰 Payment received: $${dollars} from ${who}${desc} (A&B)`);
    }
    return res.status(200).json({ received: true });
  } catch {
    return res.status(200).json({ received: true });
  }
}
