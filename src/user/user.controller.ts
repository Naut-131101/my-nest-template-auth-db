import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findByIdOrFail(userId);
    return this.usersService.toView(user);
  }

  @Patch('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const user = await this.usersService.findByIdOrFail(id);
    return this.usersService.toView(user);
  }
}
