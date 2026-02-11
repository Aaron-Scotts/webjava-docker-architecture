const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  requireAuth(async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT f.id AS favorite_id, 'library' AS source, b.id AS book_id, b.title, b.author, b.category, b.price, b.cover_url, f.created_at FROM favorite_books f JOIN books b ON f.book_id = b.id WHERE f.user_id = $1 UNION ALL SELECT f.id AS favorite_id, 'custom' AS source, c.id AS book_id, c.title, c.author, c.category, c.price, c.cover_url, f.created_at FROM favorite_books f JOIN custom_books c ON f.custom_book_id = c.id WHERE f.user_id = $1 ORDER BY created_at DESC",
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
  "/",
  requireAuth(async (req, res) => {
    try {
      const { bookId, customBookId } = req.body || {};
      if (!bookId && !customBookId) {
        return res.status(400).json({ error: "missing_fields" });
      }
      if (bookId && customBookId) {
        return res.status(400).json({ error: "ambiguous_target" });
      }
      const result = await pool.query(
        "INSERT INTO favorite_books (user_id, book_id, custom_book_id) VALUES ($1, $2, $3) RETURNING id",
        [req.user.id, bookId || null, customBookId || null]
      );
      res.status(201).json({ id: result.rows[0].id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

router.delete(
  "/:id",
  requireAuth(async (req, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM favorite_books WHERE id = $1 AND user_id = $2 RETURNING id",
        [req.params.id, req.user.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "favorite_not_found" });
      }
      res.json({ deleted: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

module.exports = router;
