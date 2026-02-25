/*
  Warnings:

  - A unique constraint covering the columns `[userId,groupId,week]` on the table `GroupMember` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "GroupMember_userId_groupId_key";

-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "rank" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "week" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_userId_groupId_week_key" ON "GroupMember"("userId", "groupId", "week");
