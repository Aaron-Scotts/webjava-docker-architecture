const express = require("express");
const authRoutes = require("./routes/auth");
const { seedWithRetry } = require("./seed");

const app = express();
app.use(express.json());

app.use("/", authRoutes);

seedWithRetry();

module.exports = app;
