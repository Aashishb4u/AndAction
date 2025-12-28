/*
  Warnings:

  - A unique constraint covering the columns `[youtubeVideoId,userId]` on the table `videos` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."videos_youtubeVideoId_key";

-- CreateIndex
CREATE UNIQUE INDEX "videos_youtubeVideoId_userId_key" ON "videos"("youtubeVideoId", "userId");
