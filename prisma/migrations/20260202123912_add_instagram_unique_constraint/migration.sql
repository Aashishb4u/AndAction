/*
  Warnings:

  - A unique constraint covering the columns `[instagramReelId,userId]` on the table `videos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "videos_instagramReelId_userId_key" ON "videos"("instagramReelId", "userId");
