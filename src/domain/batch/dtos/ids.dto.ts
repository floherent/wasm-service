import { IsArray, ArrayMinSize, IsString, IsNotEmpty } from 'class-validator';

export class IdsDto {
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsArray()
  ids: string[];
}
