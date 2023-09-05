import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { ValidationOptions, registerDecorator } from 'class-validator';

import { ONE_MB } from '@shared/constants';

export const MAX_BATCH_SIZE = 20 * ONE_MB;
export const MAX_BATCH_LENGTH = 10000;

@ValidatorConstraint({ name: 'IsJsonValue', async: false })
class IsJsonValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    const isNonNullObject = (obj: unknown) => obj !== null && typeof obj === 'object';
    if (Array.isArray(value)) {
      return value.length > 0 && value.every(isNonNullObject);
    } else {
      return isNonNullObject(value);
    }
  }

  defaultMessage() {
    return 'must be a valid object or an array of objects';
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

export const MaxBatchSize = (max = MAX_BATCH_SIZE, validationOptions?: ValidationOptions) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'MaxBatchSize',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [max],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (!Array.isArray(value)) return false;

          const maxSize = args?.constraints[0] ?? MAX_BATCH_SIZE;
          const size = Buffer.from(JSON.stringify(value)).length;

          return size <= maxSize;
        },
        defaultMessage(args: ValidationArguments) {
          const maxSize = args?.constraints[0] ?? MAX_BATCH_SIZE;
          return `must be less than or equal to ${(maxSize / ONE_MB).toFixed(3)} MB`;
        },
      },
    });
  };
};
