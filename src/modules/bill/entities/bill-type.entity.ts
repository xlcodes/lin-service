import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '@/modules/user/entities/user.entity';
import { PayTypeEnum } from '@/core/enum/bill.enum';
import { BillEntity } from '@/modules/bill/entities/bill.entity';

@Entity({
  name: 'bill_types',
})
export class BillTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
    comment: '账单类型名称',
  })
  name: string;

  @Column({
    type: 'enum',
    name: 'pay_type',
    enum: PayTypeEnum,
    default: PayTypeEnum.PAID,
    comment: '账单类型，0支出，1收入',
  })
  payType: PayTypeEnum;

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

  @OneToMany(() => BillEntity, (bill) => bill.id)
  bill: BillEntity[];

  @ManyToOne(() => UserEntity, (user) => user.uid)
  user: UserEntity;
}
