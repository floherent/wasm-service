import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { ValidationOptions, registerDecorator } from 'class-validator';

@ValidatorConstraint({ name: 'IsJsonValue', async: false })
class IsJsonValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (Array.isArray(value)) {
      return value.every((item) => typeof item === 'object');
    } else {
      return typeof value === 'object';
    }
  }

  defaultMessage() {
    return '"inputs" field must be a valid object or an array of objects.';
  }
}

export const IsJsonValue = (validationOptions?: ValidationOptions) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsJsonValueConstraint,
    });
  };
};
