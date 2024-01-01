import { ValidationArguments } from 'class-validator';
import { ValidationOptions, registerDecorator } from 'class-validator';

import { MAX_BATCH_SIZE, MAX_BATCH_LENGTH } from '@shared/constants';

interface IsJsonValueOptions {
  maxBatchSize?: number;
  maxBatchLength?: number;
}

export const IsJsonValue = (options: IsJsonValueOptions = {}, validationOptions?: ValidationOptions) => {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [options.maxBatchLength ?? MAX_BATCH_LENGTH, options.maxBatchSize ?? MAX_BATCH_SIZE],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (args.object['kind'] === 'batch') {
            if (!Array.isArray(value)) return false;
            const [maxLength, maxSize] = args.constraints;
            const size = Buffer.from(JSON.stringify(value)).length;
            return value.length > 0 && value.length <= maxLength && size <= maxSize && value.every(isNonNullObject);
          } else {
            return isNonNullObject(value);
          }
        },
        defaultMessage(args: ValidationArguments) {
          const [maxLength, maxSize] = args.constraints;
          return args.object['kind'] === 'single'
            ? `must be a valid object`
            : `must be an array of 1-${maxLength} objects (or <= ${maxSize} bytes)`;
        },
      },
    });
  };
};

export const isNonNullObject = (obj: unknown) => typeof obj === 'object' && obj !== null;
