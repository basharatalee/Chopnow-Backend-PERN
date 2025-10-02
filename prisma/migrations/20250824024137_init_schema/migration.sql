/*
  Warnings:

  - Added the required column `amount` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE "public"."Earning" (
    "id" SERIAL NOT NULL,
    "riderId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Earning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Earning_riderId_idx" ON "public"."Earning"("riderId");

-- CreateIndex
CREATE INDEX "Earning_orderId_idx" ON "public"."Earning"("orderId");

-- AddForeignKey
ALTER TABLE "public"."Earning" ADD CONSTRAINT "Earning_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Earning" ADD CONSTRAINT "Earning_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
