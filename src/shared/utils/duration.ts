export class Duration {
  // duration in milliseconds.
  private _duration: number;

  static readonly millisecondsPerSecond = 1000;
  static readonly secondsPerMinute = 60;
  static readonly minutesPerHour = 60;
  static readonly hoursPerDay = 24;

  // 1 minute = 60 * 1000 ms
  static readonly millisecondsPerMinute = Duration.millisecondsPerSecond * Duration.secondsPerMinute;

  // 1 hour   = 60 * (60 * 1000) ms
  static readonly millisecondsPerHour = Duration.minutesPerHour * Duration.millisecondsPerMinute;

  // 1 day    = 24 * (60 * 60 * 1000) ms
  static readonly millisecondsPerDay = Duration.hoursPerDay * Duration.millisecondsPerHour;

  get inMilliseconds(): number {
    return this._duration;
  }

  get inSeconds(): number {
    return this._duration / Duration.millisecondsPerSecond;
  }

  get inMinutes(): number {
    return this._duration / Duration.millisecondsPerMinute;
  }

  get inHours(): number {
    return this._duration / Duration.millisecondsPerHour;
  }

  get ago(): string {
    const hours = Math.floor(this.inHours);
    const minutes = Math.floor(this.inMinutes % Duration.minutesPerHour);
    const seconds = Math.floor(this.inSeconds % Duration.secondsPerMinute);

    let timeago = `${seconds} ${seconds > 1 ? 'secs' : 'sec'} ago`;
    if (minutes > 0) timeago = `${minutes} ${minutes > 1 ? 'mins' : 'min'} ${timeago}`;
    if (hours > 0) timeago = `${hours} ${hours > 1 ? 'hrs' : 'hr'} ${timeago}`;
    return timeago;
  }

  constructor(
    values: {
      days?: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
      milliseconds?: number;
    } = {},
  ) {
    // accept positive numbers only.
    for (let value of Object.values(values)) {
      if (value > 0) continue;
      value = 0;
    }

    // merge a clean state of duration.
    const duration = { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0, ...values };
    const { days, hours, minutes, seconds, milliseconds } = duration;

    // the total milliseconds.
    this._duration =
      milliseconds +
      Duration.millisecondsPerSecond * seconds +
      Duration.millisecondsPerMinute * minutes +
      Duration.millisecondsPerHour * hours +
      Duration.millisecondsPerDay * days;
  }

  static from(milliseconds: number): Duration {
    return new Duration({ milliseconds });
  }

  toString(): string {
    return `Duration in milliseconds: ${this.inMilliseconds}`;
  }

  humanize(type: 'short' | 'medium' | 'long' = 'short') {
    const hours = Math.floor(this.inHours);
    const minutes = Math.floor(this.inMinutes % Duration.minutesPerHour);
    const seconds = Math.floor(this.inSeconds % Duration.secondsPerMinute);

    let timeago = `${this.format(seconds, type, 's')}`;
    if (minutes > 0) timeago = `${this.format(minutes, type, 'm')} ${timeago}`;
    if (hours > 0) timeago = `${this.format(hours, type, 'h')} ${timeago}`;
    return timeago;
  }

  private format(value: number, type: 'short' | 'medium' | 'long', unit: 'h' | 'm' | 's') {
    let duration = '';
    switch (type) {
      case 'short':
        duration = unit === 'h' ? 'h' : unit === 'm' ? 'm' : 's';
        break;
      case 'medium':
        duration = unit === 'h' ? 'hr' : unit === 'm' ? 'min' : 'sec';
        break;
      case 'long':
        duration = unit === 'h' ? 'hour' : unit === 'm' ? 'minute' : 'second';
        break;
      default:
        duration = unit === 'h' ? 'hr' : unit === 'm' ? 'min' : 'sec';
    }

    duration = type === 'short' ? `${value}${duration}` : `${value} ${duration}`;
    return value > 1 && type !== 'short' ? `${duration}s` : duration;
  }
}
