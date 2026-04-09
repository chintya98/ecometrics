-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('OFFICE', 'FACTORY', 'STORAGE', 'OTHER');

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SiteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageMetric" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "waterUse" DOUBLE PRECISION NOT NULL,
    "energyUse" DOUBLE PRECISION NOT NULL,
    "carbonUse" DOUBLE PRECISION NOT NULL,
    "measurementStart" TIMESTAMP(3) NOT NULL,
    "measurementEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "UsageMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageMetric_siteId_idx" ON "UsageMetric"("siteId");

-- CreateIndex
CREATE INDEX "UsageMetric_measurementStart_measurementEnd_idx" ON "UsageMetric"("measurementStart", "measurementEnd");

-- CreateIndex
CREATE INDEX "UsageMetric_siteId_measurementStart_measurementEnd_idx" ON "UsageMetric"("siteId", "measurementStart", "measurementEnd");

-- AddForeignKey
ALTER TABLE "UsageMetric" ADD CONSTRAINT "UsageMetric_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
