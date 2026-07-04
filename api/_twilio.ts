// Shared Twilio SMS sender. Texts everyone listed in LEAD_SMS_TO
// (comma-separated, so you can notify both Brad and Serg). Best-effort and
// only runs when Twilio is configured — never throws, never blocks.
// Files prefixed with "_" are not treated as API routes by Vercel.
export async function sendSms(body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const to = process.env.LEAD_SMS_TO;
  if (!sid || !token || !from || !to) return;

  const recipients = to.split(",").map((n) => n.trim()).filter(Boolean);
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  await Promise.all(
    recipients.map(async (num) => {
      try {
        const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: num, From: from, Body: body }).toString(),
        });
        const txt = await r.text();
        if (r.ok) console.log(`[sms] sent to ${num}`);
        else console.error(`[sms] failed to ${num} (${r.status}): ${txt.slice(0, 200)}`);
      } catch (e) {
        // Never let a texting hiccup break the caller.
        console.error(`[sms] error to ${num}:`, e);
      }
    }),
  );
}
