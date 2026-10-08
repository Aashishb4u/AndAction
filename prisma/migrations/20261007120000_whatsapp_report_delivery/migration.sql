-- AlterEnum
ALTER TYPE "WhatsappReportStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "WhatsappReportStatus" ADD VALUE IF NOT EXISTS 'READ';

-- AlterTable
ALTER TABLE "whatsapp_reports" ADD COLUMN "messageId" TEXT;
ALTER TABLE "whatsapp_reports" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "whatsapp_reports" ADD COLUMN "readAt" TIMESTAMP(3);
ALTER TABLE "whatsapp_reports" ADD COLUMN "failedAt" TIMESTAMP(3);
ALTER TABLE "whatsapp_reports" ADD COLUMN "failureReason" TEXT;

-- CreateIndex
CREATE INDEX "whatsapp_reports_messageId_idx" ON "whatsapp_reports"("messageId");
