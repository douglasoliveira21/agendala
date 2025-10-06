-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1F2937',
    "maxStores" INTEGER NOT NULL DEFAULT 1,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "companies_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "company_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "company_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "company_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" DATETIME,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    CONSTRAINT "company_subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "company_plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "company_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "interval" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "maxStores" INTEGER NOT NULL DEFAULT 1,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxServices" INTEGER NOT NULL DEFAULT 50,
    "maxAppointments" INTEGER NOT NULL DEFAULT 1000,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "company_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "stripePaymentId" TEXT,
    "stripeSessionId" TEXT,
    "gatewayResponse" JSONB,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    CONSTRAINT "company_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "company_subscriptions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "whatsappNumber" TEXT,
    "whatsappConnected" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSessionId" TEXT,
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
INSERT INTO "new_stores" ("active", "address", "advanceBookingDays", "banner", "categoryId", "city", "createdAt", "description", "email", "id", "logo", "minAdvanceHours", "name", "ownerId", "phone", "primaryColor", "secondaryColor", "slug", "state", "updatedAt", "whatsappConnected", "whatsappNumber", "whatsappSessionId", "workingHours", "zipCode") SELECT "active", "address", "advanceBookingDays", "banner", "categoryId", "city", "createdAt", "description", "email", "id", "logo", "minAdvanceHours", "name", "ownerId", "phone", "primaryColor", "secondaryColor", "slug", "state", "updatedAt", "whatsappConnected", "whatsappNumber", "whatsappSessionId", "workingHours", "zipCode" FROM "stores";
DROP TABLE "stores";
ALTER TABLE "new_stores" RENAME TO "stores";
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_companyId_userId_key" ON "company_users"("companyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_stripeSubscriptionId_key" ON "company_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_companyId_key" ON "company_subscriptions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_payments_stripePaymentId_key" ON "company_payments"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "company_payments_stripeSessionId_key" ON "company_payments"("stripeSessionId");
