import { formatDate, formatTime, getStatusColor, calculateWorkHours, debounce } from '../../shared/utils';

describe('formatDate', () => {
  it('formats ISO date string to readable format', () => {
    expect(formatDate('2024-03-01')).toBe('Mar 01, 2024');
  });

  it('supports custom format patterns', () => {
    expect(formatDate('2024-03-01', 'yyyy-MM-dd')).toBe('2024-03-01');
  });
});

describe('formatTime', () => {
  it('formats ISO datetime to time string', () => {
    const result = formatTime('2024-03-01T09:30:00Z');
    expect(result).toMatch(/\d{2}:\d{2}\s(AM|PM)/);
  });

  it('returns placeholder for null time', () => {
    expect(formatTime(null)).toBe('--:--');
  });
});

describe('getStatusColor', () => {
  it('returns green classes for present', () => {
    expect(getStatusColor('present')).toContain('green');
  });

  it('returns red classes for absent', () => {
    expect(getStatusColor('absent')).toContain('red');
  });

  it('returns yellow classes for late', () => {
    expect(getStatusColor('late')).toContain('yellow');
  });

  it('returns orange classes for half-day', () => {
    expect(getStatusColor('half-day')).toContain('orange');
  });
});

describe('calculateWorkHours', () => {
  it('calculates hours between check in and check out', () => {
    const result = calculateWorkHours('2024-03-01T09:00:00Z', '2024-03-01T18:00:00Z');
    expect(result).toBe('9h 0m');
  });

  it('returns placeholder when check in is null', () => {
    expect(calculateWorkHours(null, '2024-03-01T18:00:00Z')).toBe('--');
  });

  it('returns placeholder when check out is null', () => {
    expect(calculateWorkHours('2024-03-01T09:00:00Z', null)).toBe('--');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delays function execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets timer on subsequent calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    jest.advanceTimersByTime(200);
    debounced();
    jest.advanceTimersByTime(200);

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
