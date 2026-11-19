import { formatHours, slaElapsedRatio } from './sla';
import { FIXED_NOW, buildRequest } from './testing/request-fixture';

const hoursFromNow = (hours: number) =>
  new Date(FIXED_NOW.getTime() + hours * 3_600_000).toISOString();

describe('slaElapsedRatio', () => {
  it('is 0.5 halfway between creation and due date', () => {
    const request = buildRequest({
      status: 'in_review',
      createdAt: hoursFromNow(-24),
      dueAt: hoursFromNow(24),
    });
    expect(slaElapsedRatio(request, FIXED_NOW)).toBeCloseTo(0.5);
  });

  it('caps at 1 when the deadline has passed', () => {
    const request = buildRequest({
      status: 'in_review',
      createdAt: hoursFromNow(-48),
      dueAt: hoursFromNow(-6),
    });
    expect(slaElapsedRatio(request, FIXED_NOW)).toBe(1);
  });

  it('is 0 for a request created in the future', () => {
    const request = buildRequest({
      status: 'draft',
      createdAt: hoursFromNow(5),
      dueAt: hoursFromNow(50),
    });
    expect(slaElapsedRatio(request, FIXED_NOW)).toBe(0);
  });

  it('counts closed requests as fully elapsed', () => {
    const request = buildRequest({
      status: 'completed',
      createdAt: hoursFromNow(-10),
      dueAt: hoursFromNow(100),
    });
    expect(slaElapsedRatio(request, FIXED_NOW)).toBe(1);
  });

  it('treats an invalid window as fully elapsed', () => {
    const request = buildRequest({ createdAt: hoursFromNow(10), dueAt: hoursFromNow(-10) });
    expect(slaElapsedRatio(request, FIXED_NOW)).toBe(1);
  });
});

describe('formatHours', () => {
  it.each([
    [0, '0h'],
    [5, '5h'],
    [23, '23h'],
    [24, '1d'],
    [31, '1d 7h'],
    [120, '5d'],
    [-4, '0h'],
  ])('%i hours → %s', (hours, expected) => {
    expect(formatHours(hours)).toBe(expected);
  });
});
