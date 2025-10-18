-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Expense" ("amount", "createdAt", "date", "description", "id", "updatedAt", "userId") SELECT "amount", "createdAt", "date", "description", "id", "updatedAt", "userId" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");
CREATE TABLE "new_FinancialData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalMoney" REAL NOT NULL,
    "nextPaymentDate" DATETIME NOT NULL,
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "creditUsed" REAL NOT NULL DEFAULT 0,
    "statementClosingDate" DATETIME,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FinancialData" ("createdAt", "id", "nextPaymentDate", "totalMoney", "updatedAt", "userId") SELECT "createdAt", "id", "nextPaymentDate", "totalMoney", "updatedAt", "userId" FROM "FinancialData";
DROP TABLE "FinancialData";
ALTER TABLE "new_FinancialData" RENAME TO "FinancialData";
CREATE UNIQUE INDEX "FinancialData_userId_key" ON "FinancialData"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
