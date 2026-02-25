-- CreateEnum
CREATE TYPE "Level" AS ENUM ('BEGINNER', 'IMPROVER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "LeagueType" AS ENUM ('SINGLES', 'DOUBLES');

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_leagueId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMember" DROP CONSTRAINT "GroupMember_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_groupId_fkey";

-- DropForeignKey
ALTER TABLE "SubstitutionRequest" DROP CONSTRAINT "SubstitutionRequest_matchId_fkey";

-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "matchesLost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "matchesWon" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "League" ADD COLUMN     "type" "LeagueType" NOT NULL DEFAULT 'SINGLES';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "round" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "level" "Level" NOT NULL DEFAULT 'BEGINNER',
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "WeeklyScore" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "subNeeded" BOOLEAN NOT NULL DEFAULT false,
    "subName" TEXT,
    "subContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyScore_groupId_userId_week_key" ON "WeeklyScore"("groupId", "userId", "week");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstitutionRequest" ADD CONSTRAINT "SubstitutionRequest_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScore" ADD CONSTRAINT "WeeklyScore_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScore" ADD CONSTRAINT "WeeklyScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
