import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfter', async: false })
export class IsAfterConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as string[];
    const relatedValue = (args.object as Record<string, unknown>)[
      relatedPropertyName
    ];

    if (!value || !relatedValue) {
      return false;
    }

    const dateValue = new Date(value as string | number | Date);
    const relatedDate = new Date(relatedValue as string | number | Date);

    return dateValue > relatedDate;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as string[];
    return `${args.property} must be after ${relatedPropertyName}`;
  }
}

export function IsAfter(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterConstraint,
    });
  };
}
