const express = require("express");
const pool = require("./db");
const healthRoutes = require("./routes/health");
const bookRoutes = require("./routes/books");
const customBookRoutes = require("./routes/customBooks");
const favoriteRoutes = require("./routes/favorites");
const rentalRoutes = require("./routes/rentals");
const statsRoutes = require("./routes/stats");
const adminRoutes = require("./routes/admin");

const app = express();
app.use(express.json());

async function ensureBookStockColumn() {
	try {
		const result = await pool.query(
			"SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'stock'"
		);
		if (result.rows.length === 0) {
			await pool.query("ALTER TABLE books ADD COLUMN stock INTEGER NOT NULL DEFAULT 1");
			await pool.query("UPDATE books SET stock = FLOOR(RANDOM() * 10) + 1");
		}
	} catch (err) {
		console.error("stock migration failed", err);
	}
}

ensureBookStockColumn();

app.use("/health", healthRoutes);
app.use("/books", bookRoutes);
app.use("/custom-books", customBookRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/rentals", rentalRoutes);
app.use("/stats", statsRoutes);
app.use("/admin", adminRoutes);

module.exports = app;
