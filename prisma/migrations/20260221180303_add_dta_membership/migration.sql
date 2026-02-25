-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dtaExpiryDate" TIMESTAMP(3),
ADD COLUMN     "dtaJoinedDate" TIMESTAMP(3),
ADD COLUMN     "isDtaBoardMember" BOOLEAN NOT NULL DEFAULT false;
