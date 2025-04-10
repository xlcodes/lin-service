import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BillTypeEntity } from '@/modules/bill/entities/bill-type.entity';
import { BillEntity } from '@/modules/bill/entities/bill.entity';
import { RoleEntity } from '@/modules/role/entities/role.entity';

@Entity('sys_users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  uid: number;

  @Column({
    length: 50,
    comment: '用户名',
  })
  username: string;

  @Column({
    length: 100,
    comment: '密码',
  })
  password: string;

  @Column({
    length: 100,
    comment: '用户昵称',
    name: 'nick_name',
  })
  nickName: string;

  @Column({
    length: 100,
    comment: '用户头像',
    name: 'avatar_url',
  })
  avatarUrl: string;

  @Column({
    type: 'char',
    default: false,
    comment: '是否为管理员',
  })
  isAdmin: string;

  @Column({
    comment: '微信用户唯一标识',
    default: '',
  })
  openid: string;

  @OneToMany(() => BillTypeEntity, (billType) => billType.id, {
    onDelete: 'DEFAULT',
  })
  billType: BillTypeEntity[];

  @OneToMany(() => BillEntity, (bill) => bill.id)
  bill: BillEntity[];

  @ManyToMany(() => RoleEntity, (role) => role.id)
  @JoinTable({
    name: 'user_roles',
  })
  roles: RoleEntity[];

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
