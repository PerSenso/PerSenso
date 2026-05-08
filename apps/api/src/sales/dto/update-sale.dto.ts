import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsDateString,
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
}
