/*
  Warnings:

  - You are about to drop the `Availability` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `agentId` to the `Bookable_resource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_bookableResourceId_fkey";

-- AlterTable
ALTER TABLE "Bookable_resource" ADD COLUMN     "agentId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Availability";

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "bookableResourceId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "specificDate" TIMESTAMP(3),
    "isUnavailableBlock" BOOLEAN NOT NULL DEFAULT false,
    "blockStartDate" TIMESTAMP(3),
    "blockEndDate" TIMESTAMP(3),

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bookable_resource" ADD CONSTRAINT "Bookable_resource_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_bookableResourceId_fkey" FOREIGN KEY ("bookableResourceId") REFERENCES "Bookable_resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
