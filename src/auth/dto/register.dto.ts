import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  username!: string;

  @IsString()
  @Length(12, 128)
  @Matches(/[a-z]/, { message: 'Password phải có chữ thường' })
  @Matches(/[A-Z]/, { message: 'Password phải có chữ hoa' })
  @Matches(/[0-9]/, { message: 'Password phải có chữ số' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password phải có ký tự đặc biệt',
  })
  @Matches(/^\S*$/, {
    message: 'Password không được chứa khoảng trắng',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;
}
