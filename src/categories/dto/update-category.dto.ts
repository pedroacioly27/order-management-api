import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;
}
