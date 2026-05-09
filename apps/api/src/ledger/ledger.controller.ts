import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('ledger')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class LedgerController {
  constructor(private ledgerService: LedgerService) {}

  @Get()
  getUnifiedCash() {
    return this.ledgerService.getUnifiedCash();
  }

  @Post('movements')
  createMovement(@Body() dto: CreateMovementDto) {
    return this.ledgerService.createMovement(dto);
  }

  @Roles('OWNER')
  @Delete('movements/:id')
  removeMovement(@Param('id', ParseUUIDPipe) id: string) {
    return this.ledgerService.removeMovement(id);
  }
}
