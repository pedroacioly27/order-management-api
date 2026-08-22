import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePartDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  weigth: number;

  @IsNumber()
  @IsNotEmpty()
  pieceId: number;
}
