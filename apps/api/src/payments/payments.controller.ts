import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentsService } from './payments.service';
import { StorageService } from '../storage/storage.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private storageService: StorageService,
  ) {}

  @Get('sales-with-debt')
  findSalesWithDebt() {
    return this.paymentsService.findSalesWithDebt();
  }

  @Get()
  findBySale(@Query('saleId') saleId: string) {
    return this.paymentsService.findBySale(saleId);
  }

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Post(':id/receipt')
  @UseInterceptors(
    FileInterceptor('receipt', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Solo se permiten imágenes'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Se requiere un comprobante');
    const url = await this.storageService.upload(file.buffer, 'receipts');
    return this.paymentsService.updateReceiptUrl(id, url);
  }

  @Delete(':id/receipt')
  deleteReceipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.deleteReceiptUrl(id);
  }

  @Roles('OWNER')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
