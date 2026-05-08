import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsPositive,
  IsDateString,
} from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  saleId: string;

  @IsUUID()
  clientId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  paymentMethod: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
