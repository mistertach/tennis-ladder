-- CreateEnum
CREATE TYPE "Handedness" AS ENUM ('RIGHT', 'LEFT', 'AMBIDEXTROUS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "handedness" "Handedness",
ADD COLUMN     "nationality" TEXT;

-- AlterTable
ALTER TABLE "WeeklyScore" ALTER COLUMN "gamesWon" DROP NOT NULL,
ALTER COLUMN "gamesWon" DROP DEFAULT;
