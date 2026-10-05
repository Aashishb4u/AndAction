-- CreateEnum
CREATE TYPE "WhatsappReportType" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "WhatsappReportStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "whatsapp_reports" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "type" "WhatsappReportType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "WhatsappReportStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_reports_artistId_type_periodStart_periodEnd_key" ON "whatsapp_reports"("artistId", "type", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "whatsapp_reports_status_createdAt_idx" ON "whatsapp_reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_reports_artistId_type_status_idx" ON "whatsapp_reports"("artistId", "type", "status");

-- AddForeignKey
ALTER TABLE "whatsapp_reports" ADD CONSTRAINT "whatsapp_reports_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
