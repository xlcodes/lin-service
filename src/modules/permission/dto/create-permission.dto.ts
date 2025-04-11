import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty({ message: '权限名称不能为空' })
  @IsString({ message: '权限名称应该是字符串' })
  name: string;

  @IsNotEmpty({ message: '权限描述不能为空' })
  @IsString({ message: '权限描述应该是字符串' })
  description: string;
}
