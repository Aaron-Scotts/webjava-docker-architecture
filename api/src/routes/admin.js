const express = require("express");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { redis, ensureRedis } = require("../redis");

const router = express.Router();

router.get(
  "/users",
  requireAdmin(async (_req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, name, email, role, budget, created_at FROM users ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

router.patch(
  "/users/:id/budget",
  requireAdmin(async (req, res) => {
    try {
      const { budget } = req.body || {};
      if (budget === undefined) {
        return res.status(400).json({ error: "missing_fields" });
      }
      const result = await pool.query(
        "UPDATE users SET budget = $1 WHERE id = $2 RETURNING id, name, email, role, budget",
        [budget, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "user_not_found" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

router.get(
  "/books",
  requireAdmin(async (_req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, title, author, category, price, stock, added_at FROM books ORDER BY added_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

router.patch(
  "/books/:id/stock",
  requireAdmin(async (req, res) => {
    try {
      const { stock } = req.body || {};
      if (stock === undefined) {
        return res.status(400).json({ error: "missing_fields" });
      }
      const parsedStock = Number(stock);
      if (!Number.isFinite(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ error: "invalid_stock" });
      }
      const result = await pool.query(
        "UPDATE books SET stock = $1 WHERE id = $2 RETURNING id, title, author, category, price, stock",
        [Math.floor(parsedStock), req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "book_not_found" });
      }
      await ensureRedis();
      await redis.del("books:all");
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

router.get(
  "/stats",
  requireAdmin(async (_req, res) => {
    try {
      const totals = await pool.query(
        "SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM books) AS books, (SELECT count(*) FROM rentals) AS rentals"
      );
      const usersByMonth = await pool.query(
        "WITH months AS (SELECT date_trunc('month', NOW()) - interval '11 months' + (n || ' months')::interval AS month FROM generate_series(0,11) n) SELECT to_char(month, 'YYYY-MM') AS month, COALESCE(count(u.id), 0) AS count FROM months m LEFT JOIN users u ON date_trunc('month', u.created_at) = m.month GROUP BY month ORDER BY month"
      );
      const booksByMonth = await pool.query(
        "WITH months AS (SELECT date_trunc('month', NOW()) - interval '11 months' + (n || ' months')::interval AS month FROM generate_series(0,11) n) SELECT to_char(month, 'YYYY-MM') AS month, COALESCE(count(b.id), 0) AS count FROM months m LEFT JOIN books b ON date_trunc('month', b.added_at) = m.month GROUP BY month ORDER BY month"
      );
      const rentalsByMonth = await pool.query(
        "WITH months AS (SELECT date_trunc('month', NOW()) - interval '11 months' + (n || ' months')::interval AS month FROM generate_series(0,11) n) SELECT to_char(month, 'YYYY-MM') AS month, COALESCE(count(r.id), 0) AS count FROM months m LEFT JOIN rentals r ON date_trunc('month', r.rented_at) = m.month GROUP BY month ORDER BY month"
      );
      res.json({
        totals: totals.rows[0],
        usersByMonth: usersByMonth.rows,
        booksByMonth: booksByMonth.rows,
        rentalsByMonth: rentalsByMonth.rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

module.exports = router;
