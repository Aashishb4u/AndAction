/*
  Warnings:

  - Changed the type of `eventDate` on the `bookings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "eventDate",
ADD COLUMN     "eventDate" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_artistId_eventDate_key" ON "bookings"("artistId", "eventDate");
