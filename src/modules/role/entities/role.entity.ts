import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PermissionEntity } from '@/modules/permission/entities/permission.entity';

@Entity({
  name: 'sys_roles',
})
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    comment: '角色名称',
    length: 50,
    unique: true,
  })
  name: string;

  @Column({
    comment: '角色描述',
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

  @ManyToMany(() => PermissionEntity)
  @JoinTable({
    name: 'role_permissions',
  })
  permissions: PermissionEntity[];
}
