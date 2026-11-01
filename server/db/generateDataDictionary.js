import { db } from "./database.js";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const tables = db
  .prepare(
    `
  SELECT name
  FROM sqlite_master
  WHERE type = 'table'
    AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`,
  )
  .all();

const quoteIdentifier = (name) => `"${name.replace(/"/g, '""')}"`;

const lines = [
  "# CareMesh Data Dictionary",
  "",
  "Generated from the CareMesh SQLite database schema.",
  "",
];

for (const { name } of tables) {
  const identifier = quoteIdentifier(name);

  const columns = db.prepare(`PRAGMA table_info(${identifier})`).all();

  const foreignKeys = db
    .prepare(`PRAGMA foreign_key_list(${identifier})`)
    .all();

  lines.push(`## Table: ${name}`, "");
  lines.push(
    "| Field | Data type | Primary key | Required | Default | Foreign key |",
  );
  lines.push("|---|---|---|---|---|---|");

  for (const column of columns) {
    const foreignKey = foreignKeys.find((fk) => fk.from === column.name);

    const primaryKey = column.pk ? "Yes" : "No";
    const required = column.notnull || column.pk ? "Yes" : "No";

    const defaultValue =
      column.dflt_value === null
        ? "—"
        : String(column.dflt_value).replace(/\|/g, "\\|");

    const reference = foreignKey ? `${foreignKey.table}.${foreignKey.to}` : "—";

    lines.push(
      `| ${column.name} | ${column.type || "Unspecified"} | ${primaryKey} | ${required} | ${defaultValue} | ${reference} |`,
    );
  }

  lines.push(
    "",
    `**Foreign key relationships:** ${
      foreignKeys.length
        ? foreignKeys
            .map((fk) => `${fk.from} → ${fk.table}.${fk.to}`)
            .join("; ")
        : "None declared"
    }`,
    "",
  );
}

const outputPath = resolve(process.cwd(), "CAREMesh-data-dictionary.md");

writeFileSync(outputPath, lines.join("\n"), "utf8");

console.log(`Found ${tables.length} tables.`);
console.log(`Data dictionary saved to: ${outputPath}`);

db.close();
