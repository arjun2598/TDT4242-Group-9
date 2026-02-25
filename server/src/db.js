const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "..", "data", "aiguidebook.sqlite");
const db = new sqlite3.Database(DB_PATH);

function initDb() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignmentTitle TEXT NOT NULL,
        dateOfUse TEXT NOT NULL,
        tool TEXT NOT NULL,
        purposeCategory TEXT NOT NULL,
        optionalExplanation TEXT,
        promptQueryUsed TEXT,
        outputReceived TEXT,
        modifiedOutput TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  });
}

module.exports = { db, initDb };