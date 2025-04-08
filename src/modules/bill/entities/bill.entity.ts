import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { PayTypeEnum } from '@/core/enum/bill.enum';
import { BillTypeEntity } from '@/modules/bill/entities/bill-type.entity';

@Entity({
  name: 'bills',
})
export class BillEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PayTypeEnum,
    default: PayTypeEnum.PAID,
    comment: '账单类型',
    name: 'pay_type',
  })
  payType: PayTypeEnum;

  @Column({
    comment: '账单金额，单位分',
    default: 0,
  })
  amount: number;

  @Column({
    type: 'timestamp',
    name: 'date',
    comment: '订单生成时间',
  })
  date: Date;

  @ManyToOne(() => UserEntity, (user) => user.uid)
  user: UserEntity;

  @ManyToOne(() => BillTypeEntity, (billType) => billType.id)
  type: BillTypeEntity;

  @Column({
    type: 'timestamp',
    name: 'created_at',
    comment: '创建时间',
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    name: 'updated_at',
    comment: '更新时间',
  })
  updatedAt: Date;

  @Column({
    type: 'timestamp',
    name: 'delete_at',
    default: null,
    comment: '删除时间，用于软删除',
  })
  deletedAt: Date;
}
