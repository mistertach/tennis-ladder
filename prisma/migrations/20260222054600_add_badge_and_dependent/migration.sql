-- AlterTable
ALTER TABLE "User" ADD COLUMN     "badgeNumber" TEXT,
ADD COLUMN     "isDependent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "primaryMemberId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primaryMemberId_fkey" FOREIGN KEY ("primaryMemberId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
