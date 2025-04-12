import {
  IsNotEmpty,
  ValidatorConstraintInterface,
  ValidatorConstraint,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

interface IsStringOptions extends ValidationOptions {
  allowEmpty?: boolean; // 新增配置项
  label?: string;
}

@ValidatorConstraint({ name: 'isValidString' })
class IsValidStringConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const allowEmpty =
      (args.constraints[0] as IsStringOptions)?.allowEmpty ?? false;
    if (allowEmpty) {
      return typeof value === 'string'; // 允许空字符串
    }
    return typeof value === 'string' && value.trim().length > 0; // 默认不允许空字符串
  }

  defaultMessage(args: ValidationArguments) {
    const allowEmpty =
      (args.constraints[0] as IsStringOptions)?.allowEmpty ?? false;
    const label =
      (args.constraints[0] as IsStringOptions)?.label ?? args.property;
    return allowEmpty
      ? `${label} 必须是字符串类型`
      : `${label} 必须是非空字符串`;
  }
}

export function IsValidString(options?: IsStringOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: options,
      constraints: [options], // 传递配置
      validator: IsValidStringConstraint,
    });
  };
}

// ===================================================================
// // 1. 定义验证逻辑类
// @ValidatorConstraint({ name: 'isNonEmptyString' })
// class IsNonEmptyStringConstraint<T> implements ValidatorConstraintInterface {
//   validate(value: T) {
//     return typeof value === 'string' && value.trim().length > 0; // 必须是字符串且非空
//   }
//
//   defaultMessage(args: ValidationArguments) {
//     return `${args.property} 必须是非空字符串`; // 自定义错误消息
//   }
// }
//
// // 2. 创建装饰器函数
// function IsNonEmptyString(validationOptions?: ValidationOptions) {
//   return function (object: object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName: propertyName,
//       options: validationOptions,
//       constraints: [],
//       validator: IsNonEmptyStringConstraint,
//     });
//   };
// }
// ===================================================================

export class LoginUserDto {
  // @IsNonEmptyString({ message: '用户名必须是非空字符串' })
  // @IsNonEmptyString()
  @IsValidString({ label: '用户名' })
  username: string;

  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
