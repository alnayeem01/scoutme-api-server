/*
  Warnings:

  - A unique constraint covering the columns `[firebaseUID]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firebaseUID` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firebaseUID" TEXT NOT NULL,
ALTER COLUMN "photoUrl" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUID_key" ON "User"("firebaseUID");
