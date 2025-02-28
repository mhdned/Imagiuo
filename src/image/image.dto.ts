import { IsPositive, IsString } from 'class-validator';

export class createImageDTO {
  @IsString()
  filename: string;
  @IsString()
  mimetype: string;
  @IsString()
  path: string;
  @IsPositive()
  size: number;
}
