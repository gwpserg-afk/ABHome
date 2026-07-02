import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Secret key lives ONLY in the server environment (Vercel env / local .env) — never in client code or git.
  const secret = process.env.STRIPE_SECRET_KEY || "";
  if (!secret) return res.status(500).json({ error: "Payments are not configured yet." });
  const stripe = new Stripe(secret);

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { mode, amount, description, email } = body as {
      mode?: string; amount?: number; description?: string; email?: string;
    };

    // "deposit" = fixed $500 booking deposit. "invoice" = custom amount Brad quoted (in whole dollars).
    const dollars = mode === "deposit" ? 500 : Math.round(Number(amount));
    if (!dollars || dollars < 1 || dollars > 100000) {
      return res.status(400).json({ error: "Please enter a valid amount between $1 and $100,000." });
    }

    const origin = (req.headers.origin as string) || `https://${req.headers.host}`;
    const name =
      mode === "deposit"
        ? "A&B Home Improvement — Booking Deposit"
        : description || "A&B Home Improvement — Roofing Invoice";

    // Payment methods (card, Affirm, Klarna...) follow whatever is enabled in the Stripe Dashboard.
    // Enable Affirm + Klarna there to offer monthly payment plans — they pay Brad in full upfront.

    if (mode === "deposit") {
      // Client pays immediately on the site → redirect Checkout Session.
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          { quantity: 1, price_data: { currency: "usd", unit_amount: dollars * 100, product_data: { name } } },
        ],
        customer_email: email || undefined,
        metadata: { source: "website-deposit" },
        success_url: `${origin}/pay/success`,
        cancel_url: `${origin}/pay/cancel`,
      });
      return res.status(200).json({ url: session.url });
    }

    // Brad's invoice → a permanent Payment Link he can text/email; doesn't expire.
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: dollars * 100,
      product_data: { name },
    });
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { source: "brad-invoice" },
      after_completion: { type: "redirect", redirect: { url: `${origin}/pay/success` } },
    });
    const url = email ? `${link.url}?prefilled_email=${encodeURIComponent(email)}` : link.url;
    return res.status(200).json({ url });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Something went wrong creating the payment." });
  }
}
