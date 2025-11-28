-- AlterTable
ALTER TABLE "artists" ADD COLUMN     "instagramAccessToken" TEXT,
ADD COLUMN     "instagramConnectedAt" TIMESTAMP(3),
ADD COLUMN     "instagramTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "instagramUsername" TEXT,
ADD COLUMN     "youtubeAccessToken" TEXT,
ADD COLUMN     "youtubeChannelName" TEXT,
ADD COLUMN     "youtubeConnectedAt" TIMESTAMP(3),
ADD COLUMN     "youtubeRefreshToken" TEXT,
ADD COLUMN     "youtubeTokenExpiry" TIMESTAMP(3);
