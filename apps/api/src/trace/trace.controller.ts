import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TraceService } from './trace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('trace')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class TraceController {
  constructor(private traceService: TraceService) {}

  @Get(':id')
  resolve(@Param('id', ParseUUIDPipe) id: string) {
    return this.traceService.resolveId(id);
  }
}
