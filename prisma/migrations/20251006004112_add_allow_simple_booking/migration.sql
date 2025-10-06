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
    "whatsappCountryCode" TEXT,
    "whatsappAreaCode" TEXT,
    "whatsappNumber" TEXT,
    "whatsappFullNumber" TEXT,
    "whatsappConnected" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSessionId" TEXT,
    "whatsappApiKey" TEXT,
    "whatsappStatus" TEXT,
    "workingHours" JSONB,
    "advanceBookingDays" INTEGER NOT NULL DEFAULT 30,
    "minAdvanceHours" INTEGER NOT NULL DEFAULT 2,
    "allowSimpleBooking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT,
    "ownerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "coverImage" TEXT,
    "logoImage" TEXT,
    CONSTRAINT "stores_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stores_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_stores" ("active", "address", "advanceBookingDays", "banner", "categoryId", "city", "companyId", "coverImage", "createdAt", "description", "email", "id", "logo", "logoImage", "minAdvanceHours", "name", "ownerId", "phone", "primaryColor", "secondaryColor", "slug", "state", "updatedAt", "whatsappApiKey", "whatsappAreaCode", "whatsappConnected", "whatsappCountryCode", "whatsappFullNumber", "whatsappNumber", "whatsappSessionId", "whatsappStatus", "workingHours", "zipCode") SELECT "active", "address", "advanceBookingDays", "banner", "categoryId", "city", "companyId", "coverImage", "createdAt", "description", "email", "id", "logo", "logoImage", "minAdvanceHours", "name", "ownerId", "phone", "primaryColor", "secondaryColor", "slug", "state", "updatedAt", "whatsappApiKey", "whatsappAreaCode", "whatsappConnected", "whatsappCountryCode", "whatsappFullNumber", "whatsappNumber", "whatsappSessionId", "whatsappStatus", "workingHours", "zipCode" FROM "stores";
DROP TABLE "stores";
ALTER TABLE "new_stores" RENAME TO "stores";
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
