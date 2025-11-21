
const { supabaseAdmin } = require("../supabaseClient");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Missing Authorization header" });

    const [scheme, token] = authHeader.split(" ");

    if (!token || scheme !== "Bearer")
      return res.status(401).json({ error: "Malformed Authorization header" });


    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    next();
  } catch (err) {
    console.error("auth error", err);
    return res.status(500).json({ error: "Auth verification failed" });
  }
}

module.exports = authMiddleware;