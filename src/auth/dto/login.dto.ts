import { IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(3, 255)
  identifier!: string;

  @IsString()
  @Length(1, 128)
  password!: string;
}
