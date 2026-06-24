import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class UpdateSaleDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  total?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;
}
