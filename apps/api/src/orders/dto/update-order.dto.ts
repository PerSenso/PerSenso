import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marketingCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
