/*
  Warnings:

  - Added the required column `whatsappAreaCode` to the `stores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappCountryCode` to the `stores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappFullNumber` to the `stores` table without a default value. This is not possible if the table is not empty.
  - Made the column `whatsappNumber` on table `stores` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `whatsappAreaCode` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappCountryCode` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappFullNumber` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsappNumber` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_stores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1F2937',
    "whatsappCountryCode" TEXT NOT NULL,
    "whatsappAreaCode" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "whatsappFullNumber" TEXT NOT NULL,
    "whatsappConnected" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSessionId" TEXT,
    "whatsappApiKey" TEXT,
    "whatsappStatus" TEXT,
    "workingHours" JSONB,
    "advanceBookingDays" INTEGER NOT NULL DEFAULT 30,
    "minAdvanceHours" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT,
    "ownerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "stores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "stores_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stores_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_stores" ("active", "address", "advanceBookingDays", "banner", "categoryId", "city", "companyId", "createdAt", "description", "email", "id", "logo", "minAdvanceHours", "name", "ownerId", "phone", "primaryColor", "secondaryColor", "slug", "state", "updatedAt", "whatsappApiKey", "whatsappConnected", "whatsappNumber", "whatsappSessionId", "whatsappStatus", "workingHours", "zipCode") SELECT "active", "address", "advanceBookingDays", "banner", "categoryId", "city", "companyId", "createdAt", "description", "email", "id", "logo", "minAdvanceHours", "name", "ownerId", "phone", "primaryColor", "secondaryColor", "slug", "state", "updatedAt", "whatsappApiKey", "whatsappConnected", "whatsappNumber", "whatsappSessionId", "whatsappStatus", "workingHours", "zipCode" FROM "stores";
DROP TABLE "stores";
ALTER TABLE "new_stores" RENAME TO "stores";
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsappCountryCode" TEXT NOT NULL,
    "whatsappAreaCode" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "whatsappFullNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatar", "createdAt", "email", "id", "name", "password", "phone", "role", "updatedAt") SELECT "avatar", "createdAt", "email", "id", "name", "password", "phone", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
