-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isDataSharingOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isMarketingOptIn" BOOLEAN NOT NULL DEFAULT false;
