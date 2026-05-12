-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('ACTIVA', 'ANULADA');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "status" "SaleStatus" NOT NULL DEFAULT 'ACTIVA';
