import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsPositive,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InitialPaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  method: string;
}

export class CreateSaleDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  productId: string;

  @IsNumber()
  @IsPositive()
  total: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InitialPaymentDto)
  initialPayment?: InitialPaymentDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InitialPaymentDto)
  initialPayments?: InitialPaymentDto[];
}
