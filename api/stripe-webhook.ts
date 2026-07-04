import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendSms } from "./_twilio";

// Texts the team when a customer pays. To turn on:
//  1) Stripe → Developers → Webhooks → Add endpoint:
//       https://www.abroofingmi.com/api/stripe-webhook?token=YOUR_SECRET
//     Events: checkout.session.completed (and payment_intent.succeeded).
//  2) Vercel (ab-home) → add STRIPE_WEBHOOK_TOKEN = the same YOUR_SECRET.
// The ?token guards the endpoint so only Stripe (with your secret) can trigger it.
// Always returns 200 so Stripe never retry-storms.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.STRIPE_WEBHOOK_TOKEN;
  // Disabled until a token is set; and reject anything without the matching token.
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
