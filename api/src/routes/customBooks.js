const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  requireAuth(async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT id, title, author, category, price, cover_url, source, created_at FROM custom_books WHERE user_id = $1 ORDER BY created_at DESC",
        [req.user.id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

router.post(
  "/import",
  requireAuth(async (req, res) => {
    try {
      const payload = req.body || {};
      const books = Array.isArray(payload) ? payload : payload.books;
      if (!Array.isArray(books) || books.length === 0) {
        return res.status(400).json({ error: "missing_books" });
      }
      await pool.query("BEGIN");
      for (const book of books) {
        const { title, author, category, price, coverUrl, cover_url } = book || {};
        if (!title || !author || !category || price === undefined) {
          await pool.query("ROLLBACK");
          return res.status(400).json({ error: "invalid_book" });
        }
        await pool.query(
          "INSERT INTO custom_books (user_id, title, author, category, price, cover_url, source) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [
            req.user.id,
            title,
            author,
            category,
            price,
            coverUrl || cover_url || null,
            JSON.stringify(book),
          ]
        );
      }
      await pool.query("COMMIT");
      res.json({ inserted: books.length });
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

module.exports = router;
