import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePieceDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}
