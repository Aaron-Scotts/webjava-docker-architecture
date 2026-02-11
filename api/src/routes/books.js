const express = require("express");
const axios = require("axios");
const pool = require("../db");
const { redis, ensureRedis } = require("../redis");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
const openLibraryQuery = process.env.OPEN_LIBRARY_QUERY || "classic literature";
const openLibraryLimit = process.env.OPEN_LIBRARY_LIMIT
  ? Number(process.env.OPEN_LIBRARY_LIMIT)
  : 24;

function pickCover(doc) {
  if (doc.isbn && doc.isbn.length > 0) {
    return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
  }
  if (doc.cover_i) {
    return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
  }
  return null;
}

async function seedFromOpenLibrary() {
  const response = await axios.get("https://openlibrary.org/search.json", {
    params: {
      q: openLibraryQuery,
      limit: openLibraryLimit,
    },
    timeout: 5000,
  });
  const docs = response.data && response.data.docs ? response.data.docs : [];
  if (docs.length === 0) {
    return 0;
  }
  await pool.query("BEGIN");
  try {
    for (const doc of docs) {
      const title = doc.title || "Untitled";
      const author = (doc.author_name && doc.author_name[0]) || "Unknown";
      const category = (doc.subject && doc.subject[0]) || "General";
      const price = Math.floor(120 + Math.random() * 180);
      const stock = Math.floor(1 + Math.random() * 10);
      const coverUrl = pickCover(doc);
      await pool.query(
        "INSERT INTO books (title, author, category, price, stock, cover_url) VALUES ($1, $2, $3, $4, $5, $6)",
        [title, author, category, price, stock, coverUrl]
      );
    }
    await pool.query("COMMIT");
    return docs.length;
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

router.get("/", async (_req, res) => {
  try {
    await ensureRedis();
    const cached = await redis.get("books:all");
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    let result = await pool.query(
      "SELECT id, title, author, category, price, stock, cover_url, added_at FROM books ORDER BY added_at DESC"
    );
    if (result.rows.length < openLibraryLimit) {
      try {
        await seedFromOpenLibrary();
        result = await pool.query(
          "SELECT id, title, author, category, price, stock, cover_url, added_at FROM books ORDER BY added_at DESC"
        );
      } catch (err) {
        console.error("Open Library seed failed", err);
      }
    }
    await redis.set("books:all", JSON.stringify(result.rows), { EX: 60 });
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, author, category, price, stock, cover_url, added_at FROM books WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "not_found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.post(
  "/",
  requireAdmin(async (req, res) => {
    try {
      const { title, author, category, price, coverUrl, stock } = req.body || {};
      if (!title || !author || !category || price === undefined) {
        return res.status(400).json({ error: "missing_fields" });
      }
      const parsedStock = stock === undefined ? null : Number(stock);
      if (parsedStock !== null && (!Number.isFinite(parsedStock) || parsedStock < 0)) {
        return res.status(400).json({ error: "invalid_stock" });
      }
      const stockValue = parsedStock === null ? Math.floor(1 + Math.random() * 10) : Math.floor(parsedStock);
      const result = await pool.query(
        "INSERT INTO books (title, author, category, price, stock, cover_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, author, category, price, stock, cover_url, added_at",
        [title, author, category, price, stockValue, coverUrl || null]
      );
      await ensureRedis();
      await redis.del("books:all");
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

router.post(
  "/import",
  requireAdmin(async (req, res) => {
    try {
      const payload = req.body || {};
      const books = Array.isArray(payload) ? payload : payload.books;
      if (!Array.isArray(books) || books.length === 0) {
        return res.status(400).json({ error: "missing_books" });
      }
      await pool.query("BEGIN");
      for (const book of books) {
        const { title, author, category, price, coverUrl, cover_url, stock } = book || {};
        if (!title || !author || !category || price === undefined) {
          await pool.query("ROLLBACK");
          return res.status(400).json({ error: "invalid_book" });
        }
        const parsedStock = stock === undefined ? null : Number(stock);
        if (parsedStock !== null && (!Number.isFinite(parsedStock) || parsedStock < 0)) {
          await pool.query("ROLLBACK");
          return res.status(400).json({ error: "invalid_book" });
        }
        const stockValue = parsedStock === null ? Math.floor(1 + Math.random() * 10) : Math.floor(parsedStock);
        await pool.query(
          "INSERT INTO books (title, author, category, price, stock, cover_url) VALUES ($1, $2, $3, $4, $5, $6)",
          [title, author, category, price, stockValue, coverUrl || cover_url || null]
        );
      }
      await pool.query("COMMIT");
      await ensureRedis();
      await redis.del("books:all");
      res.json({ inserted: books.length });
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

module.exports = router;
