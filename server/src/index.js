const app = require("./app");
const { DB_PATH } = require("./db");

const PORT = process.env.PORT || 3001;

console.log("SQLite DB path:", DB_PATH);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});