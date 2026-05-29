/*
  Warnings:

  - Added the required column `description` to the `Bookable_resource` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bookable_resource" ADD COLUMN     "description" TEXT NOT NULL;
