/*
  Warnings:

  - A unique constraint covering the columns `[artistId,eventDate]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "city" TEXT,
ADD COLUMN     "state" TEXT,
ALTER COLUMN "eventDate" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_artistId_eventDate_key" ON "bookings"("artistId", "eventDate");
