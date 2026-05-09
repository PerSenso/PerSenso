import {
  IsString,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateMovementDto {
  @IsIn(['ingreso', 'retiro'])
  type: string;

  @IsString()
  source: string;

  @IsString()
  method: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
