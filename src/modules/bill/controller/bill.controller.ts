import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { BillService } from '../service/bill.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireLogin } from '@/core/decorator/custom.decorator';
import { CreateBillDto } from '@/modules/bill/dto/bill.dto';

@ApiTags('账单模块')
@Controller('bill')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @ApiOperation({ summary: '账单查询 - 全量查询' })
  @Get('list')
  @RequireLogin()
  async getList() {
    return 'list';
  }

  // TODO: 添加账分页查询

  @ApiOperation({ summary: '创建账单' })
  @Post('create')
  @RequireLogin()
  async create(@Body() dto: CreateBillDto) {
    return 'create';
  }

  @ApiOperation({ summary: '更新账单' })
  @Post('update')
  @RequireLogin()
  async update() {
    return 'update';
  }

  @ApiOperation({ summary: '软删除账单' })
  @Delete('delete')
  @RequireLogin()
  async delete() {
    return 'delete';
  }
}
