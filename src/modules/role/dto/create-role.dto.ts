import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: '角色名称不能为空' })
  @IsString({ message: '角色名称应该是字符串' })
  name: string;

  @IsNotEmpty({ message: '角色描述不能为空' })
  @IsString({ message: '角色描述应该是字符串' })
  description: string;

  @IsOptional()
  @IsString({ message: '角色权限应该是字符串' })
  permissions?: string[];
}
