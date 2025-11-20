/*
  Warnings:

  - The primary key for the `MatchAnalysis` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MatchRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Player` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MatchAnalysis" DROP CONSTRAINT "MatchAnalysis_matchId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_matchRequestId_fkey";

-- AlterTable
ALTER TABLE "MatchAnalysis" DROP CONSTRAINT "MatchAnalysis_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "matchId" SET DATA TYPE TEXT,
ADD CONSTRAINT "MatchAnalysis_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "MatchAnalysis_id_seq";

-- AlterTable
ALTER TABLE "MatchRequest" DROP CONSTRAINT "MatchRequest_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "MatchRequest_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "MatchRequest_id_seq";

-- AlterTable
ALTER TABLE "Player" DROP CONSTRAINT "Player_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "matchRequestId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Player_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Player_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id";

-- AddForeignKey
ALTER TABLE "MatchAnalysis" ADD CONSTRAINT "MatchAnalysis_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_matchRequestId_fkey" FOREIGN KEY ("matchRequestId") REFERENCES "MatchRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
