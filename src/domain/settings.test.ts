import { describe, expect, it } from 'vitest';
import { athleteWith, checkHeartRate, checkPaceBand, parsePace, readSettings } from './settings';

describe('athleteWith', () => {
  it('uses what the athlete set and keeps the estimate for the rest', () => {
    const estimate = { maxHr: 188, restHr: 46, sex: 'male' as const };
    expect(athleteWith(estimate, {})).toEqual(estimate);
    expect(athleteWith(estimate, { maxHr: 195 })).toEqual({ maxHr: 195, restHr: 46, sex: 'male' });
    expect(athleteWith(estimate, { maxHr: 195, restHr: 42 })).toEqual({ maxHr: 195, restHr: 42, sex: 'male' });
  });
});

describe('checkHeartRate', () => {
  it('accepts plausible whole numbers', () => {
    expect(checkHeartRate('maxHr', 192, 50)).toBeNull();
    expect(checkHeartRate('restHr', 44, 192)).toBeNull();
  });

  it('rejects values outside the limits', () => {
    expect(checkHeartRate('maxHr', 120, 50)).toBe('maxHrRange');
    expect(checkHeartRate('maxHr', 191.5, 50)).toBe('maxHrRange');
    expect(checkHeartRate('restHr', 120, 190)).toBe('restHrRange');
  });

  it('keeps rest well below max', () => {
    expect(checkHeartRate('maxHr', 150, 110)).toBeNull();
    expect(checkHeartRate('restHr', 90, 120)).toBe('reserve');
  });
});

describe('parsePace', () => {
  it('reads m:ss and m.ss', () => {
    expect(parsePace('5:30')).toBe(330);
    expect(parsePace(' 6.05 ')).toBe(365);
    expect(parsePace('10:00')).toBe(600);
  });

  it('refuses anything else', () => {
    expect(parsePace('5')).toBeNull();
    expect(parsePace('5:75')).toBeNull();
    expect(parsePace('abc')).toBeNull();
  });
});

describe('checkPaceBand', () => {
  it('needs a faster start than end, within limits', () => {
    expect(checkPaceBand({ from: 330, to: 360 })).toBeNull();
    expect(checkPaceBand({ from: 360, to: 330 })).toBe('paceOrder');
    expect(checkPaceBand({ from: 60, to: 330 })).toBe('paceRange');
  });
});

describe('readSettings', () => {
  it('keeps valid saved values and drops broken ones', () => {
    expect(readSettings({ maxHr: 193, restHr: 44, easyPace: { from: 320, to: 350 } })).toEqual({
      maxHr: 193,
      restHr: 44,
      easyPace: { from: 320, to: 350 },
    });
    expect(readSettings({ maxHr: 'x', restHr: 400, easyPace: { from: 400, to: 300 } })).toEqual({});
    expect(readSettings(null)).toEqual({});
  });
});
