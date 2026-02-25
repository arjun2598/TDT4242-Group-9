const express = require("express");
const cors = require("cors");
const { db, initDb } = require("./db");
const { LogCreateSchema } = require("./validation");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

initDb();

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});