import { hueOf, initialsOf } from '../ui';

describe('initialsOf', () => {
  it.each([
    ['Ana Souza', 'AS'],
    ['Maria da Silva Costa', 'MC'],
    ['bruno', 'B'],
    ['  ', '?'],
  ])('%s → %s', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});

describe('hueOf', () => {
  it('is stable for the same name and within 0-359', () => {
    expect(hueOf('Carla Mendes')).toBe(hueOf('Carla Mendes'));
    expect(hueOf('Carla Mendes')).toBeGreaterThanOrEqual(0);
    expect(hueOf('Carla Mendes')).toBeLessThan(360);
  });
});
