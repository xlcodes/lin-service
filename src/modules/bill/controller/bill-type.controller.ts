import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireLogin, UserInfo } from '@/core/decorator/custom.decorator';
import {
  CreateBillTypeDto,
  UpdateBillTypeDto,
} from '@/modules/bill/dto/bill-type.dto';
import { BillTypeService } from '@/modules/bill/service/bill-type.service';
import { generateParseIntPipe } from '@/core/utils/custom-pipe';

@ApiTags('账单分类')
@Controller('bill-type')
export class BillTypeController {
  @Inject(BillTypeService)
  private billTypeService: BillTypeService;

  @ApiOperation({ summary: '账单分类分页查询' })
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
    @UserInfo('uid') uid: number,
  ) {
    return await this.billTypeService.list(pageNo, pageSize, uid);
  }

  @ApiOperation({ summary: '创建账单分类' })
  @Post('create')
  @RequireLogin()
  async create(@Body() dto: CreateBillTypeDto, @UserInfo('uid') uid: number) {
    return await this.billTypeService.create(dto, uid);
  }

  @ApiOperation({ summary: '更新账单分类' })
  @Post('update')
  @RequireLogin()
  async update(@Body() dto: UpdateBillTypeDto, @UserInfo('uid') uid: number) {
    return await this.billTypeService.update(dto, uid);
  }

  @ApiOperation({ summary: '软删除账单分类' })
  @Delete('delete/:id')
  @RequireLogin()
  async delete(
    @Param('id', generateParseIntPipe('id')) bid: number,
    @UserInfo('uid') uid: number,
  ) {
    return await this.billTypeService.delete(bid, uid);
  }

  @ApiOperation({ summary: '恢复账单分类' })
  @Post('recover/:id')
  @RequireLogin()
  async recover(
    @Param('id', generateParseIntPipe('id')) bid: number,
    @UserInfo('uid') uid: number,
  ) {
    return await this.billTypeService.recover(bid, uid);
  }
}
