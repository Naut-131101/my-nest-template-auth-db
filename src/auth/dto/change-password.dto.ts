import { IsString, Length, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @Length(1, 128)
  currentPassword!: string;

  @IsString()
  @Length(12, 128)
  @Matches(/[a-z]/, { message: 'Password mới phải có chữ thường' })
  @Matches(/[A-Z]/, { message: 'Password mới phải có chữ hoa' })
  @Matches(/[0-9]/, { message: 'Password mới phải có chữ số' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password mới phải có ký tự đặc biệt',
  })
  @Matches(/^\S*$/, {
    message: 'Password không được chứa khoảng trắng',
  })
  newPassword!: string;
}
