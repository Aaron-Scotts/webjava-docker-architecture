const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");
const { redis, ensureRedis } = require("../redis");

const router = express.Router();

router.post(
  "/",
  requireAuth(async (req, res) => {
    try {
      const { bookId } = req.body || {};
      if (!bookId) {
        return res.status(400).json({ error: "missing_fields" });
      }
      const bookResult = await pool.query(
        "SELECT id, title, price, stock FROM books WHERE id = $1",
        [bookId]
      );
      if (bookResult.rows.length === 0) {
        return res.status(404).json({ error: "book_not_found" });
      }
      const book = bookResult.rows[0];
      if (Number(book.stock) <= 0) {
        return res.status(400).json({ error: "out_of_stock" });
      }
      const budgetResult = await pool.query(
        "SELECT budget FROM users WHERE id = $1",
        [req.user.id]
      );
      const budget = Number(budgetResult.rows[0].budget);
      if (budget < Number(book.price)) {
        return res.status(400).json({ error: "insufficient_budget" });
      }
      await pool.query("BEGIN");
      const stockResult = await pool.query(
        "UPDATE books SET stock = stock - 1 WHERE id = $1 AND stock > 0 RETURNING stock",
        [book.id]
      );
      if (stockResult.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res.status(400).json({ error: "out_of_stock" });
      }
      await pool.query(
        "INSERT INTO rentals (user_id, book_id) VALUES ($1, $2)",
        [req.user.id, book.id]
      );
      const newBudget = budget - Number(book.price);
      await pool.query("UPDATE users SET budget = $1 WHERE id = $2", [
        newBudget,
        req.user.id,
      ]);
      await pool.query("COMMIT");
      await ensureRedis();
      await redis.del("books:all");
      res.status(201).json({
        message: "rented",
        budget: newBudget,
      });
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

router.post(
  "/:id/return",
  requireAuth(async (req, res) => {
    try {
      await pool.query("BEGIN");
      const result = await pool.query(
        "UPDATE rentals SET returned_at = NOW() WHERE id = $1 AND user_id = $2 AND returned_at IS NULL RETURNING id, book_id",
        [req.params.id, req.user.id]
      );
      if (result.rows.length === 0) {
        await pool.query("ROLLBACK");
        return res.status(404).json({ error: "rental_not_found" });
      }
      await pool.query("UPDATE books SET stock = stock + 1 WHERE id = $1", [
        result.rows[0].book_id,
      ]);
      await pool.query("COMMIT");
      await ensureRedis();
      await redis.del("books:all");
      res.json({ message: "returned" });
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

router.get(
  "/current",
  requireAuth(async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT r.id, r.rented_at, b.title, b.author, b.category, b.price, b.cover_url FROM rentals r JOIN books b ON r.book_id = b.id WHERE r.user_id = $1 AND r.returned_at IS NULL ORDER BY r.rented_at DESC",
        [req.user.id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

router.get(
  "/history",
  requireAuth(async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT r.id, r.rented_at, r.returned_at, b.title, b.author, b.category, b.price, b.cover_url FROM rentals r JOIN books b ON r.book_id = b.id WHERE r.user_id = $1 ORDER BY r.rented_at DESC",
        [req.user.id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

module.exports = router;
