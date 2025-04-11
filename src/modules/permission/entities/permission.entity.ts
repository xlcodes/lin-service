import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'sys_permissions',
})
export class PermissionEntity {
  @PrimaryGeneratedColumn({ comment: '权限唯一标识' })
  id: number;

  @Column({
    comment: '权限名称',
    length: 50,
    unique: true,
  })
  name: string;

  @Column({
    comment: '权限描述',
    length: 100,
  })
  description: string;

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
