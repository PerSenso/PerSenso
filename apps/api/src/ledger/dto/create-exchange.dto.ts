import { IsString, IsNumber, IsPositive, IsDateString, IsOptional } from 'class-validator';

export class CreateExchangeDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  fromMethod: string;

  @IsString()
  toMethod: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
