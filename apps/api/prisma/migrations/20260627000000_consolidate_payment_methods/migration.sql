-- binance → usdt (Payment)
UPDATE "Payment" SET "paymentMethod" = 'usdt' WHERE LOWER("paymentMethod") = 'binance';

-- dolares / Dólares → efectivo (Payment)
UPDATE "Payment" SET "paymentMethod" = 'efectivo' WHERE LOWER("paymentMethod") IN ('dolares', 'dólares');

-- binance → usdt (CashMovement)
UPDATE "CashMovement" SET "method" = 'usdt' WHERE LOWER("method") = 'binance';

-- dolares → efectivo (CashMovement)
UPDATE "CashMovement" SET "method" = 'efectivo' WHERE LOWER("method") IN ('dolares', 'dólares');
