import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
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

  @Get('contributions')
  getContributions() {
    return this.ledgerService.getContributions();
  }

  @Post('movements')
  createMovement(@Body() dto: CreateMovementDto) {
    return this.ledgerService.createMovement(dto);
  }

  @Patch('movements/:id')
  updateMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMovementDto,
  ) {
    return this.ledgerService.updateMovement(id, dto);
  }

  @Delete('movements/:id')
  removeMovement(@Param('id', ParseUUIDPipe) id: string) {
    return this.ledgerService.removeMovement(id);
  }
}
