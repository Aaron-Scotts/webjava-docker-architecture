const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { redis, ensureRedis } = require("../redis");

const router = express.Router();
const tokenTtlSeconds = process.env.AUTH_TOKEN_TTL
  ? Number(process.env.AUTH_TOKEN_TTL)
  : 60 * 60 * 24;
const cookieName = process.env.AUTH_COOKIE_NAME || "riubs_auth";

function extractToken(req) {
  const header = req.header("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice("bearer ".length).trim();
  }
  const cookieHeader = req.header("cookie") || "";
  const tokenCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  if (tokenCookie) {
    return decodeURIComponent(tokenCookie.split("=").slice(1).join("="));
  }
  return req.query.token || null;
}

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "email_in_use" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, budget) VALUES ($1, $2, $3, 'user', 5000) RETURNING id, name, email, role, budget",
      [name, email, passwordHash]
    );
    const user = result.rows[0];
    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role, budget FROM users WHERE email = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "invalid_credentials" });
    }
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "invalid_credentials" });
    }
    await ensureRedis();
    const token = crypto.randomUUID();
    await redis.set(`auth:token:${token}`, String(user.id), {
      EX: tokenTtlSeconds,
    });
    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: tokenTtlSeconds * 1000,
      path: "/",
    });
    res.json({
      token,
      expiresIn: tokenTtlSeconds,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        budget: Number(user.budget),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/validate", async (req, res) => {
  try {
    await ensureRedis();
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ valid: false });
    }
    const userId = await redis.get(`auth:token:${token}`);
    if (!userId) {
      return res.status(401).json({ valid: false });
    }
    const result = await pool.query(
      "SELECT id, name, email, role, budget FROM users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ valid: false });
    }
    const user = result.rows[0];
    res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        budget: Number(user.budget),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/logout", async (_req, res) => {
  res.cookie(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  res.json({ success: true });
});

module.exports = router;
