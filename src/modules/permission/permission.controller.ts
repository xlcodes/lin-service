import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { generateParseIntPipe } from '@/core/utils/custom-pipe';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsAdmin, UserInfo } from '@/core/decorator/custom.decorator';

@ApiTags('权限标识模块')
@Controller('permission')
@IsAdmin()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @ApiOperation({ summary: '创建权限标识' })
  @Post()
  create(@Body() dto: CreatePermissionDto, @UserInfo('uid') uid: number) {
    return this.permissionService.create(dto, uid);
  }

  @ApiOperation({ summary: '获取权限标识-分页' })
  @Get()
  findAll(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(20),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @UserInfo('uid')
    uid: number,
  ) {
    return this.permissionService.findAll(pageNo, pageSize, uid);
  }

  @ApiOperation({ summary: '获取权限标识详情' })
  @Get(':id')
  findOne(
    @Param('id', generateParseIntPipe('id')) id: number,
    @UserInfo('uid') uid: number,
  ) {
    return this.permissionService.findOne(id, uid);
  }

  @ApiOperation({ summary: '修改权限标识' })
  @Patch(':id')
  update(
    @Param('id', generateParseIntPipe('id')) id: number,
    @Body() dto: UpdatePermissionDto,
    @UserInfo('uid') uid: number,
  ) {
    return this.permissionService.update(id, dto, uid);
  }

  @ApiOperation({ summary: '删除权限标识' })
  @Delete(':id')
  remove(
    @Param('id', generateParseIntPipe('id')) id: number,
    @UserInfo('uid') uid: number,
  ) {
    return this.permissionService.remove(id, uid);
  }
}
