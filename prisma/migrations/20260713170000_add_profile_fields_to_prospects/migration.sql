ALTER TABLE "prospects"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "zip" TEXT,
ADD COLUMN "gender" TEXT,
ADD COLUMN "dob" TIMESTAMP(3),
ADD COLUMN "youtubeChannelId" TEXT,
ADD COLUMN "youtubeChannelName" TEXT,
ADD COLUMN "youtubeConnectedAt" TIMESTAMP(3);
