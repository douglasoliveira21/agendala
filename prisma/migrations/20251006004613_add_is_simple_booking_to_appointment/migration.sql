-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientEmail" TEXT,
    "totalPrice" REAL,
    "isSimpleBooking" BOOLEAN NOT NULL DEFAULT false,
    "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "storeId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "clientId" TEXT,
    CONSTRAINT "appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_appointments" ("clientEmail", "clientId", "clientName", "clientPhone", "confirmationSent", "createdAt", "date", "endTime", "id", "notes", "reminderSent", "serviceId", "startTime", "status", "storeId", "totalPrice", "updatedAt") SELECT "clientEmail", "clientId", "clientName", "clientPhone", "confirmationSent", "createdAt", "date", "endTime", "id", "notes", "reminderSent", "serviceId", "startTime", "status", "storeId", "totalPrice", "updatedAt" FROM "appointments";
DROP TABLE "appointments";
ALTER TABLE "new_appointments" RENAME TO "appointments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
