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
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { IsAdmin, UserInfo } from '@/core/decorator/custom.decorator';
import { generateParseIntPipe } from '@/core/utils/custom-pipe';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('角色管理')
@Controller('role')
@IsAdmin()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiOperation({ summary: '创建角色' })
  @Post()
  create(@Body() dto: CreateRoleDto, @UserInfo('uid') uid: number) {
    return this.roleService.create(dto, uid);
  }

  @ApiOperation({ summary: '查询角色-分页' })
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
    return this.roleService.findAll(pageNo, pageSize, uid);
  }

  @ApiOperation({ summary: '查询角色详情' })
  @Get(':id')
  findOne(
    @Param('id', generateParseIntPipe('id')) id: number,
    @UserInfo('uid') uid: number,
  ) {
    return this.roleService.findOne(id, uid);
  }

  @ApiOperation({ summary: '修改角色' })
  @Patch(':id')
  update(
    @Param('id', generateParseIntPipe('id')) id: number,
    @Body() dto: UpdateRoleDto,
    @UserInfo('uid') uid: number,
  ) {
    return this.roleService.update(id, dto, uid);
  }

  @ApiOperation({ summary: '删除角色' })
  @Delete(':id')
  remove(
    @Param('id', generateParseIntPipe('id')) id: number,
    @UserInfo('uid') uid: number,
  ) {
    return this.roleService.remove(id, uid);
  }
}
