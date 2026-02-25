const express = require("express");
const cors = require("cors");
const { db, initDb, DB_PATH } = require("./db");
const { LogCreateSchema } = require("./validation");

const app = express();
const PORT = process.env.PORT || 3001;

// middleware
app.use(cors());
app.use(express.json());

initDb();
console.log("SQLite DB path:", DB_PATH);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET /logs
app.get("/logs", (req, res) => {
  db.all("SELECT * FROM logs ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error", details: err.message });
    res.json(rows);
  });
});

// POST /logs
app.post("/logs", (req, res) => {
  const parsed = LogCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error", details: parsed.error.flatten() });
  }

  const d = parsed.data;

  const sql = `
    INSERT INTO logs (
      assignmentTitle, dateOfUse, tool, purposeCategory, optionalExplanation,
      promptQueryUsed, outputReceived, modifiedOutput
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    d.assignmentTitle,
    d.dateOfUse,
    d.tool,
    d.purposeCategory,
    d.optionalExplanation ?? null,
    d.promptQueryUsed ?? null,
    d.outputReceived ?? null,
    d.modifiedOutput ?? null,
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: "DB error", details: err.message });

    db.get("SELECT * FROM logs WHERE id = ?", [this.lastID], (err2, row) => {
      if (err2) return res.status(500).json({ error: "DB error", details: err2.message });
      res.status(201).json(row);
    });
  });
});

// PUT /logs/:id
app.put("/logs/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const parsed = LogCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error", details: parsed.error.flatten() });
  }

  const d = parsed.data;

  const sql = `
    UPDATE logs
    SET assignmentTitle = ?, dateOfUse = ?, tool = ?, purposeCategory = ?, optionalExplanation = ?,
        promptQueryUsed = ?, outputReceived = ?, modifiedOutput = ?
    WHERE id = ?
  `;

  const params = [
    d.assignmentTitle,
    d.dateOfUse,
    d.tool,
    d.purposeCategory,
    d.optionalExplanation ?? null,
    d.promptQueryUsed ?? null,
    d.outputReceived ?? null,
    d.modifiedOutput ?? null,
    id,
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: "DB error", details: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Not found" });

    db.get("SELECT * FROM logs WHERE id = ?", [id], (err2, row) => {
      if (err2) return res.status(500).json({ error: "DB error", details: err2.message });
      res.json(row);
    });
  });
});

// DELETE /logs/:id
app.delete("/logs/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  db.run("DELETE FROM logs WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: "DB error", details: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});