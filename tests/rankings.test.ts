import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";
import { publicRankingQuery } from "../server/rankings";
it("orders before limiting beyond1000 rows and suppresses legacy duplicates when canonical ranking is private", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE documents(key TEXT,value TEXT,owner TEXT,public INTEGER)",
  );
  const insert = db.prepare("INSERT INTO documents VALUES(?,?,?,?)");
  for (let i = 0; i < 1100; i++)
    insert.run(
      "ranking:u" + i,
      JSON.stringify({ nickname: "u" + i, score: i, seconds: 1 }),
      "u" + i,
      1,
    );
  insert.run(
    "ranking:private:old",
    JSON.stringify({ nickname: "hidden", score: 9999, seconds: 0 }),
    "private",
    1,
  );
  insert.run(
    "ranking:private",
    JSON.stringify({ nickname: "hidden", score: 9999, seconds: 0 }),
    "private",
    0,
  );
  const rows = db.prepare(publicRankingQuery).all() as { value: string }[];
  expect(rows).toHaveLength(50);
  expect(JSON.parse(rows[0].value).score).toBe(1099);
  expect(JSON.stringify(rows)).not.toContain("hidden");
  db.close();
});
