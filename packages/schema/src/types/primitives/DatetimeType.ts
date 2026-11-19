import moment from 'moment';
import { Type } from '@ja-platform/parser-type-system';

export class DatetimeType extends Type {
  static DEFAULT_FORMAT = 'MMMM D YYYY h:mm A';
  static readonly TYPE = 'datetime';

  constructor() {
    super(DatetimeType.TYPE);
  }
  format(value: any, format?: string): string {
    return moment(value).format(format ?? DatetimeType.DEFAULT_FORMAT);
  }

  is(value: any): boolean {
    return value instanceof Date;
  }

  parse(value: any): any {
    if (value instanceof Date) {
      return value;
    } else {
      throw new Error(value + ' is not a Date');
    }
  }
}
