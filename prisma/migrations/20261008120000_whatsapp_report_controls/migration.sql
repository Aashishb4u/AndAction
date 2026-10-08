-- Admin pause/resume for the existing WhatsApp analytics report cron.
-- A missing row means the cron remains active.

CREATE TABLE IF NOT EXISTS "whatsapp_report_controls" (
    "id" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_report_controls_pkey" PRIMARY KEY ("id")
);
