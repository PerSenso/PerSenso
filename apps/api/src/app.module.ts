import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { StorageModule } from './storage/storage.module';
import { ClientsModule } from './clients/clients.module';
import { SalesModule } from './sales/sales.module';
import { PaymentsModule } from './payments/payments.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { OrdersModule } from './orders/orders.module';
import { LedgerModule } from './ledger/ledger.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    ProductsModule,
    StorageModule,
    ClientsModule,
    SalesModule,
    PaymentsModule,
    SuppliersModule,
    OrdersModule,
    LedgerModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
