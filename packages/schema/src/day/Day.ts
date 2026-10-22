import { dateFromTime, isPureDate } from './utils';

export class Day {
  private _time: Date;

  /**
   * Today in the local timezone.
   */
  constructor();
  /**
   * Construct from a local Date, another Day, a date string, or a UTC midnight timestamp.
   * Date strings use their leading YYYY-MM-DD portion without timezone conversion.
   */
  constructor(date: Date | Day | string | number);
  /**
   * Construct from a year, zero-based month and day of month.
   */
  constructor(year: number, month: number, day: number);
  constructor(...args: [] | [Date | Day | string | number] | [number, number, number]) {
    if (args.length === 3) {
      this._time = new Date(Date.UTC(args[0], args[1], args[2]));
    } else if (args.length === 1 && args[0] instanceof Date) {
      this._time = dateFromTime(args[0]);
    } else if (args.length === 1 && Day.isDay(args[0])) {
      this._time = args[0].toDate();
    } else if (args.length === 1 && typeof args[0] === 'string') {
      if (!/^\d\d\d\d-\d\d-\d\d/.test(args[0])) {
        throw new Error('Invalid date format');
      }
      this._time = new Date(args[0].substring(0, 10) + 'T00:00Z');
    } else if (args.length === 1 && typeof args[0] === 'number') {
      const date = new Date(args[0]);
      if (!isPureDate(date)) {
        throw new Error('Invalid Day');
      }
      this._time = date;
    } else if (args.length === 0) {
      this._time = dateFromTime(new Date());
    } else {
      throw new Error('Invalid args for Day()');
    }
  }

  static today(): Day {
    return new Day();
  }

  static fromUTCDate(date: Date): Day {
    return new Day(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  /**
   * Recognize Day objects, including instances from other copies of the package.
   */
  static isDay(obj: unknown): obj is Day {
    return (
      obj instanceof Day ||
      (obj !== null &&
        typeof obj === 'object' &&
        'startOfDay' in obj &&
        typeof obj.startOfDay === 'function' &&
        'endOfDay' in obj &&
        typeof obj.endOfDay === 'function')
    );
  }

  /**
   * Return a copy of the date at midnight UTC.
   */
  toDate(): Date {
    return new Date(this._time.getTime());
  }

  toString(): string {
    return this._time.toISOString().substring(0, 10);
  }

  toJSON(): string {
    return this.toString();
  }

  toISOString(): string {
    return this.toString();
  }

  valueOf(): number {
    return this._time.getTime();
  }

  /**
   * Start of the day in the local timezone.
   */
  startOfDay(): Date {
    return new Date(this.getYear(), this.getMonth(), this.getDay());
  }

  /**
   * End of the day in the local timezone.
   */
  endOfDay(): Date {
    return new Date(this.getYear(), this.getMonth(), this.getDay(), 23, 59, 59, 999);
  }

  getYear(): number {
    return this._time.getUTCFullYear();
  }

  /**
   * Zero-based month, from 0 (January) to 11 (December).
   */
  getMonth(): number {
    return this._time.getUTCMonth();
  }

  getDay(): number {
    return this._time.getUTCDate();
  }

  /**
   * Day of the week, from 0 (Sunday) to 6 (Saturday).
   */
  getDayOfWeek(): number {
    return this._time.getUTCDay();
  }
}
