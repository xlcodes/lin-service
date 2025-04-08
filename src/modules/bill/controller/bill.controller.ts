import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { BillService } from '../service/bill.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireLogin, UserInfo } from '@/core/decorator/custom.decorator';
import { CreateBillDto, UpdateBillDto } from '@/modules/bill/dto/bill.dto';
import { generateParseIntPipe } from '@/core/utils/custom-pipe';

@ApiTags('账单模块')
@Controller('bill')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @ApiOperation({ summary: '账单查询 - 全量查询' })
  @Get('list')
  @RequireLogin()
  async getList(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(20),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('date', new DefaultValuePipe(Date.now()))
    date: Date,
    @UserInfo('uid')
    uid: number,
  ) {
    return await this.billService.list({ pageNo, pageSize }, { date }, uid);
  }

  @ApiOperation({ summary: '创建账单' })
  @Post('create')
  @RequireLogin()
  async create(@Body() dto: CreateBillDto, @UserInfo('uid') uid: number) {
    return await this.billService.create(dto, uid);
  }

  @ApiOperation({ summary: '更新账单' })
  @Post('update')
  @RequireLogin()
  async update(@Body() dto: UpdateBillDto, @UserInfo('uid') uid: number) {
    return await this.billService.update(dto, uid);
  }

  @ApiOperation({ summary: '软删除账单' })
  @Delete('delete/:id')
  @RequireLogin()
  async delete(
    @Param('id', generateParseIntPipe('id')) billId: number,
    @UserInfo('uid') uid: number,
  ) {
    return await this.billService.delete(billId, uid);
  }
}
