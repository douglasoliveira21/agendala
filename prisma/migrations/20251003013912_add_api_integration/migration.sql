-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" DATETIME,
    "expiresAt" DATETIME,
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "companyId" TEXT,
    "storeId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "api_keys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "api_keys_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "api_keys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "api_usage_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "apiKeyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_usage_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");
