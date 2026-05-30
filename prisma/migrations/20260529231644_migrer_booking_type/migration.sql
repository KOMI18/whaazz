/*
  Warnings:

  - The `status` column on the `booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `bookingType` on the `Bookable_resource` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `price` on the `Bookable_resource` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLE');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('TIME_SLOT', 'CAPACITY', 'DATE_RANGE', 'CAPACITY_RECURRENT');

-- AlterTable
ALTER TABLE "Bookable_resource" DROP COLUMN "bookingType",
ADD COLUMN     "bookingType" "BookingType" NOT NULL,
DROP COLUMN "price",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "availability" ADD COLUMN     "maxCapacity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "booking" DROP COLUMN "status",
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING';
