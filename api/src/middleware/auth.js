const { getUserFromAuth } = require("../authClient");

function requireAuth(handler) {
  return async (req, res) => {
    const user = await getUserFromAuth(req);
    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    req.user = user;
    return handler(req, res);
  };
}

function requireAdmin(handler) {
  return requireAuth((req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "forbidden" });
    }
    return handler(req, res);
  });
}

module.exports = { requireAuth, requireAdmin };
