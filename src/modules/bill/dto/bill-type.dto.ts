import { IsEnum, IsNotEmpty, IsNumber, Length } from 'class-validator';
import { PayTypeEnum } from '@/core/enum/bill.enum';

export class CreateBillTypeDto {
  @IsNotEmpty({ message: '账单分类名称不能为空' })
  @Length(2, 10, { message: '账单分类名称限制在2～10个字符之间' })
  name: string;

  @IsNotEmpty({ message: `账单类型不能为空` })
  @IsEnum(PayTypeEnum, {
    message: `请输入有效的账单类型：${PayTypeEnum.PAID}支出，${PayTypeEnum.RECEIVED}收入`,
  })
  payType: PayTypeEnum;
}

export class UpdateBillTypeDto extends CreateBillTypeDto {
  @IsNotEmpty({ message: '分类ID不能为空' })
  @IsNumber({}, { message: '账单分类ID应当为数字类型' })
  id: number;
}

export class DeleteBillTypeDto {
  @IsNotEmpty({ message: '分类ID不能为空' })
  @IsNumber({}, { message: '账单分类ID应当为数字类型' })
  id: number;
}
