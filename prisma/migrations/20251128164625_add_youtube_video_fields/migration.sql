/*
  Warnings:

  - A unique constraint covering the columns `[youtubeVideoId]` on the table `videos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "durationFormatted" TEXT,
ADD COLUMN     "isShort" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'youtube',
ADD COLUMN     "youtubeVideoId" TEXT,
ALTER COLUMN "duration" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "videos_youtubeVideoId_key" ON "videos"("youtubeVideoId");

-- CreateIndex
CREATE INDEX "videos_youtubeVideoId_idx" ON "videos"("youtubeVideoId");

-- CreateIndex
CREATE INDEX "videos_isShort_idx" ON "videos"("isShort");
