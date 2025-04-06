import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
