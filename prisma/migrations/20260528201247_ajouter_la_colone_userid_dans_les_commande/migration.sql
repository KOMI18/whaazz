/*
  Warnings:

  - Added the required column `userId` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable

ALTER TABLE "orders" ADD COLUMN "userId" TEXT;

UPDATE "orders" SET "userId" = 'cmp58xen0000001o1itvou49u' WHERE "userId" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "userId" SET NOT NULL;
-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
