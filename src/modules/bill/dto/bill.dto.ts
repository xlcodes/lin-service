import { IsDate, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { PayTypeEnum } from '@/core/enum/bill.enum';

export class CreateBillDto {
  @IsNotEmpty({ message: `账单类型不能为空` })
  @IsEnum(PayTypeEnum, {
    message: `请输入有效的账单类型：${PayTypeEnum.PAID}支出，${PayTypeEnum.RECEIVED}收入`,
  })
  payType: PayTypeEnum;

  @IsNotEmpty({
    message: '账单金额不能为空',
  })
  @IsNumber({}, { message: '账单金额类型异常，请输入数字' })
  amount: number;

  @IsNotEmpty({
    message: '账单产生时间不能为空',
  })
  @IsDate({
    message: '账单产生时间类型异常，请输入时间类型',
  })
  date: Date;

  @IsNotEmpty({ message: `账单分类不能为空` })
  typeId: number;
}

export class UpdateBillDto extends CreateBillDto {
  @IsNotEmpty({ message: '账单ID不能为空' })
  @IsNumber({}, { message: '账单ID应当为数字类型' })
  id: number;
}
