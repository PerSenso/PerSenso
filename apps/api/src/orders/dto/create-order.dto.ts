import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsPositive,
  IsDateString,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RestockLineDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @Min(0)
  baseUnitCost: number;
}

export class FundingEntryDto {
  @IsString()
  investor: string;

  @IsString()
  method: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}

export class CreateOrderDto {
  @IsDateString()
  date: string;

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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RestockLineDto)
  restocks: RestockLineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FundingEntryDto)
  fundingEntries?: FundingEntryDto[];
}
