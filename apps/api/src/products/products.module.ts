import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
