/*
  Warnings:

  - You are about to drop the column `profilePictureUrl` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "profilePictureUrl",
ADD COLUMN     "avatar" TEXT;
