-- AlterTable
ALTER TABLE "Bookable_resource" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Bookable_resource" ADD CONSTRAINT "Bookable_resource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
