import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

// Native .env file loader
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
} catch {
  // Ignore error
}

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.error("Error: TURSO_DATABASE_URL is not set to a valid libsql:// URL.");
  console.error("Please add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your .env file.");
  process.exit(1);
}

const client = createClient({
  url,
  authToken,
});

const statements = [
  // 1. UserSettings
  `CREATE TABLE IF NOT EXISTS "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "monthlyBudget" REAL NOT NULL DEFAULT 0,
    "rolloverEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloverAmount" REAL NOT NULL DEFAULT 0,
    "includeTodayInDays" BOOLEAN NOT NULL DEFAULT true,
    "receiptStoragePath" TEXT NOT NULL DEFAULT './public/receipts',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  // 2. IncomeSource
  `CREATE TABLE IF NOT EXISTS "IncomeSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Salary',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  // 3. FixedExpense
  `CREATE TABLE IF NOT EXISTS "FixedExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Bills',
    "dayOfMonth" INTEGER NOT NULL DEFAULT 1,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  // 4. SavingsAllocation
  `CREATE TABLE IF NOT EXISTS "SavingsAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'fixed',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  // 5. Category
  `CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "type" TEXT NOT NULL DEFAULT 'expense',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");`,

  // 6. Transaction
  `CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'expense',
    "categoryId" TEXT,
    "merchant" TEXT NOT NULL,
    "note" TEXT,
    "essential" BOOLEAN NOT NULL DEFAULT false,
    "satisfaction" TEXT,
    "receiptPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS "Transaction_date_idx" ON "Transaction"("date");`,
  `CREATE INDEX IF NOT EXISTS "Transaction_categoryId_idx" ON "Transaction"("categoryId");`,
  `CREATE INDEX IF NOT EXISTS "Transaction_type_idx" ON "Transaction"("type");`,
  `CREATE INDEX IF NOT EXISTS "Transaction_date_type_idx" ON "Transaction"("date", "type");`,

  // 7. SavingsGoal
  `CREATE TABLE IF NOT EXISTS "SavingsGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "targetAmount" REAL NOT NULL,
    "currentAmount" REAL NOT NULL DEFAULT 0,
    "targetDate" DATETIME,
    "monthlyContribution" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  // 8. SavingsContribution
  `CREATE TABLE IF NOT EXISTS "SavingsContribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("goalId") REFERENCES "SavingsGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS "SavingsContribution_goalId_idx" ON "SavingsContribution"("goalId");`,
  `CREATE INDEX IF NOT EXISTS "SavingsContribution_date_idx" ON "SavingsContribution"("date");`,

  // 9. MonthlyOverride
  `CREATE TABLE IF NOT EXISTS "MonthlyOverride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyOverride_sourceType_sourceId_month_key" ON "MonthlyOverride"("sourceType", "sourceId", "month");`,
  `CREATE INDEX IF NOT EXISTS "MonthlyOverride_month_idx" ON "MonthlyOverride"("month");`,
  `CREATE INDEX IF NOT EXISTS "MonthlyOverride_sourceType_sourceId_idx" ON "MonthlyOverride"("sourceType", "sourceId");`,

  // 10. DayMetadata
  `CREATE TABLE IF NOT EXISTS "DayMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "emoji" TEXT,
    "note" TEXT
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DayMetadata_date_key" ON "DayMetadata"("date");`,
  `CREATE INDEX IF NOT EXISTS "DayMetadata_date_idx" ON "DayMetadata"("date");`,

  // 11. MonthlySnapshot
  `CREATE TABLE IF NOT EXISTS "MonthlySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "totalIncome" REAL NOT NULL,
    "totalExpenses" REAL NOT NULL,
    "totalSavings" REAL NOT NULL,
    "rollover" REAL NOT NULL DEFAULT 0,
    "endBalance" REAL NOT NULL DEFAULT 0,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "MonthlySnapshot_month_key" ON "MonthlySnapshot"("month");`,
  `CREATE INDEX IF NOT EXISTS "MonthlySnapshot_month_idx" ON "MonthlySnapshot"("month");`,
];

async function main() {
  console.log(`Connecting to Turso at: ${url}...`);
  try {
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    console.log("✅ All tables and indexes successfully created on Turso!");

    // Check if UserSettings exists
    const settingsCheck = await client.execute('SELECT COUNT(*) as count FROM "UserSettings";');
    const count = Number(settingsCheck.rows[0]?.count ?? 0);
    if (count === 0) {
      console.log("Initializing default UserSettings...");
      await client.execute({
        sql: `INSERT INTO "UserSettings" (id, currency, theme, monthlyBudget, rolloverEnabled, includeTodayInDays)
              VALUES ('default', 'INR', 'system', 0, false, true);`,
        args: [],
      });
      console.log("✅ Default UserSettings initialized.");
    }

    // Check default categories
    const catCheck = await client.execute('SELECT COUNT(*) as count FROM "Category";');
    const catCount = Number(catCheck.rows[0]?.count ?? 0);
    if (catCount === 0) {
      console.log("Initializing default categories...");
      const defaultCategories = [
        { name: "Food & Dining", color: "#f97316", icon: "utensils" },
        { name: "Groceries", color: "#84cc16", icon: "shopping-cart" },
        { name: "Transport", color: "#3b82f6", icon: "car" },
        { name: "Housing", color: "#6366f1", icon: "home" },
        { name: "Utilities", color: "#06b6d4", icon: "zap" },
        { name: "Entertainment", color: "#a855f7", icon: "film" },
        { name: "Shopping", color: "#ec4899", icon: "shopping-bag" },
        { name: "Health", color: "#ef4444", icon: "heart" },
        { name: "Salary", color: "#22c55e", icon: "briefcase", type: "income" },
        { name: "Freelance", color: "#10b981", icon: "laptop", type: "income" },
        { name: "Investments", color: "#059669", icon: "trending-up", type: "income" },
      ];

      for (let i = 0; i < defaultCategories.length; i++) {
        const cat = defaultCategories[i];
        const id = `cat_${i + 1}`;
        await client.execute({
          sql: `INSERT INTO "Category" (id, name, color, icon, type, sortOrder, active)
                VALUES (?, ?, ?, ?, ?, ?, true);`,
          args: [id, cat.name, cat.color, cat.icon, cat.type || "expense", i],
        });
      }
      console.log("✅ Default categories created.");
    }
  } catch (error) {
    console.error("❌ Failed to sync tables with Turso:", error);
    process.exit(1);
  }
}

main();
