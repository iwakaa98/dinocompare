-- AlterTable
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN "planStatus" TEXT NOT NULL DEFAULT 'inactive',
ADD COLUMN "planCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN "searchQuotaMonth" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateTable
CREATE TABLE "CatalogSnapshot" (
    "productSlug" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "bestTotal" DOUBLE PRECISION,
    "worstTotal" DOUBLE PRECISION,
    "savingsEur" DOUBLE PRECISION,
    "offerCount" INTEGER NOT NULL DEFAULT 0,
    "refreshedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogSnapshot_pkey" PRIMARY KEY ("productSlug")
);
