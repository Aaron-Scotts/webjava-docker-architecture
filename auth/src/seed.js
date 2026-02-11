const bcrypt = require("bcryptjs");
const pool = require("./db");

async function ensureUser({ name, email, password, role, budget }) {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (name, email, password_hash, role, budget) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [name, email, passwordHash, role, budget]
  );
  return result.rows[0].id;
}

async function ensureDefaults() {
  await ensureUser({
    name: "Admin",
    email: "admin@library.local",
    password: "admin123",
    role: "admin",
    budget: 10000,
  });
  await ensureUser({
    name: "Demo User",
    email: "demo@library.local",
    password: "demo123",
    role: "user",
    budget: 5000,
  });
}

let seedAttempts = 0;
async function seedWithRetry() {
  try {
    await ensureDefaults();
  } catch (err) {
    seedAttempts += 1;
    console.error("Failed to seed default users", err);
    if (seedAttempts < 5) {
      setTimeout(seedWithRetry, 5000);
    }
  }
}

module.exports = { seedWithRetry };
