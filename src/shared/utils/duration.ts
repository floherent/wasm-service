import DurationUtils from '@udlearn/duration';

export class Duration extends DurationUtils {
  static from(value: number): Duration {
    return new Duration(DurationUtils.from(value, 'milliseconds'));
  }

  get ago(): string {
    return `${this.short} ago`;
  }
}
