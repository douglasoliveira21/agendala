-- CreateTable
CREATE TABLE "backups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FULL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "size" BIGINT,
    "filePath" TEXT,
    "compressed" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT,
    "storeId" TEXT,
    "createdById" TEXT NOT NULL,
    "metadata" JSONB,
    "error" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "backups_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "backups_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "backups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "backup_restores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "backupId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dropExisting" BOOLEAN NOT NULL DEFAULT false,
    "restoreData" BOOLEAN NOT NULL DEFAULT true,
    "restoreSchema" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "storeId" TEXT,
    "createdById" TEXT NOT NULL,
    "error" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "backup_restores_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "backups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "backup_restores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "backup_restores_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "backup_restores_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
