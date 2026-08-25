import { Controller, Get, Post, Delete, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Profiles')
@Controller('profiles')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  async getMyProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  async updateMyProfile(@Body() dto: Record<string, unknown>, @CurrentUser('sub') userId: string) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow a user' })
  async followUser(@Param('id') targetId: string, @CurrentUser('sub') userId: string) {
    return this.usersService.follow(targetId, userId);
  }

  @Delete(':id/follow')
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollowUser(@Param('id') targetId: string, @CurrentUser('sub') userId: string) {
    return this.usersService.unfollow(targetId, userId);
  }

  @Get('me/scenes')
  @ApiOperation({ summary: 'Get followed scenes' })
  async getMyScenes(@CurrentUser('sub') userId: string) {
    return this.usersService.getFollowedScenes(userId);
  }

  @Post('me/scenes/:city/follow')
  @ApiOperation({ summary: 'Follow a scene' })
  async followScene(@Param('city') city: string, @CurrentUser('sub') userId: string) {
    return this.usersService.followScene(userId, city);
  }

  @Delete('me/scenes/:city/follow')
  @ApiOperation({ summary: 'Unfollow a scene' })
  async unfollowScene(@Param('city') city: string, @CurrentUser('sub') userId: string) {
    return this.usersService.unfollowScene(userId, city);
  }
}
