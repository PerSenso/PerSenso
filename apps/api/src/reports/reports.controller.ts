import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OWNER')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('summary')
  getSummary() {
    return this.reportsService.getSummary();
  }
}
