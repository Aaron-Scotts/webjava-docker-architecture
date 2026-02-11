const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/user",
  requireAuth(async (req, res) => {
    try {
      const monthly = await pool.query(
        "WITH months AS (SELECT date_trunc('month', NOW()) - interval '11 months' + (n || ' months')::interval AS month FROM generate_series(0,11) n) SELECT to_char(month, 'YYYY-MM') AS month, COALESCE(count(r.id), 0) AS count FROM months m LEFT JOIN rentals r ON date_trunc('month', r.rented_at) = m.month AND r.user_id = $1 GROUP BY month ORDER BY month",
        [req.user.id]
      );
      const categories = await pool.query(
        "SELECT b.category, count(*)::int AS count FROM rentals r JOIN books b ON r.book_id = b.id WHERE r.user_id = $1 GROUP BY b.category ORDER BY count DESC",
        [req.user.id]
      );
      res.json({
        rentalTrend: monthly.rows,
        categoryBreakdown: categories.rows,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "internal_error" });
    }
  })
);

module.exports = router;
