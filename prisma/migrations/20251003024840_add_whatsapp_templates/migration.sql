-- CreateTable
CREATE TABLE "whatsapp_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "whatsapp_templates_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
