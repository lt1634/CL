/**
 * POST /api/push-send
 * body: { secret, subscription, title?, body? }
 * 需與 Vercel 環境變數 PUSH_TEST_SECRET 一致（僅供測試／後台；勿寫死在前端 repo）
 */
const webpush = require("web-push");

function parseBody(req) {
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const serverSecret = process.env.PUSH_TEST_SECRET;
  const contact = process.env.VAPID_CONTACT_EMAIL || "mailto:admin@localhost";

  if (!pub || !priv || !serverSecret) {
    return res.status(503).json({
      error: "push_not_configured",
      hint: "Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, PUSH_TEST_SECRET on Vercel",
    });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return res.status(400).json({ error: "invalid_body" });
  }

  if (body.secret !== serverSecret) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { subscription, title, body: notifyBody } = body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "missing_subscription" });
  }

  webpush.setVapidDetails(contact, pub, priv);

  const payload = JSON.stringify({
    title: title || "VA Star-Getter",
    body: notifyBody || "Push test OK",
  });

  try {
    await webpush.sendNotification(subscription, payload, {
      TTL: 60,
      urgency: "normal",
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      error: "send_failed",
      message: err && err.message ? err.message : String(err),
    });
  }
};
