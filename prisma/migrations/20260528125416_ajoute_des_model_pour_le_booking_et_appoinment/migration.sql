-- CreateTable
CREATE TABLE "Bookable_resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bookingType" TEXT NOT NULL,
    "duration" INTEGER,
    "maxCapacity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Bookable_resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "bookableResourceId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "specificDate" TIMESTAMP(3),
    "isUnavailableBlock" BOOLEAN NOT NULL DEFAULT false,
    "blockStartDate" TIMESTAMP(3),
    "blockEndDate" TIMESTAMP(3),

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "bookableResourceId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_bookableResourceId_fkey" FOREIGN KEY ("bookableResourceId") REFERENCES "Bookable_resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_bookableResourceId_fkey" FOREIGN KEY ("bookableResourceId") REFERENCES "Bookable_resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
