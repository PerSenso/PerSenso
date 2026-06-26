-- Existing orders are already received, so default to RECIBIDO for them
ALTER TABLE "Order" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'RECIBIDO';
-- Future orders start as PENDIENTE
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE';
