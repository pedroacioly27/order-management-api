import { IsBoolean } from 'class-validator';

export class RemoveOrderDto {
  @IsBoolean()
  refunded: boolean;
}
