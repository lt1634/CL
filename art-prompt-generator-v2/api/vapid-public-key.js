/**
 * GET /api/vapid-public-key
 * 回傳 Web Push VAPID 公開金鑰（供前端 subscribe）
 */
module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const publicKey = process.env.VAPID_PUBLIC_KEY || "";
  if (!publicKey) {
    return res.status(200).json({ configured: false, publicKey: null });
  }
  return res.status(200).json({ configured: true, publicKey });
};
