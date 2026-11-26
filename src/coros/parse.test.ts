import { describe, expect, it } from 'vitest';
import { RESTING_HR, SPORT_RECORDS, USER_INFO, wrap } from './fixtures';
import { CorosFormatError, parseRestingHr, parseSex, parseSportRecords, sportOfCode, toolText } from './parse';

const TZ = 'Europe/Warsaw';

describe('toolText', () => {
  it('unwraps the JSON string COROS puts the text in', () => {
    expect(toolText(wrap(SPORT_RECORDS), 'querySportRecords')).toBe(SPORT_RECORDS);
  });

  it('throws COROS’s own message when the call failed', () => {
    expect(() => toolText({ ...wrap('Token expired'), isError: true }, 'querySportRecords')).toThrow(/Token expired/);
  });
});

describe('parseSportRecords', () => {
  const activities = parseSportRecords(SPORT_RECORDS, TZ);

  it('reads every record', () => {
    expect(activities.map((a) => a.id)).toEqual([
      '100000000000000005',
      '100000000000000004',
      '100000000000000003',
      '100000000000000002',
      '100000000000000001',
    ]);
  });

  it('maps a run with distance, moving time, heart rate and local start', () => {
    expect(activities[0]).toEqual({
      id: '100000000000000005',
      name: 'Outdoor Run',
      sport: 'run',
      start: '2026-11-25T10:46:40',
      distance: 10980,
      movingTime: 58 * 60 + 3,
      elevationGain: 0,
      averageHeartrate: 140,
    });
  });

  it('reads records without a distance, whose heart rate sits after a line break', () => {
    expect(activities[1]).toMatchObject({ sport: 'other', distance: 0, movingTime: 43 * 60 + 7, averageHeartrate: 90 });
  });

  it('reads distances in metres and durations over an hour', () => {
    expect(activities[2]).toMatchObject({ distance: 979, sport: 'other' });
    expect(activities[3]).toMatchObject({ sport: 'run', movingTime: 2 * 3600 + 3 * 60 + 41, distance: 22060 });
  });

  it('leaves heart rate out when COROS has none', () => {
    expect(activities[4]!.sport).toBe('ride');
    expect(activities[4]).not.toHaveProperty('averageHeartrate');
  });

  it('accepts an empty range', () => {
    expect(parseSportRecords('Sport Records — 2026-11-20 to 2026-11-26 (0 records)\n========================\n')).toEqual([]);
  });

  it('fails loudly when the format changes', () => {
    expect(() => parseSportRecords('Activities between …')).toThrow(CorosFormatError);
    expect(() => parseSportRecords(SPORT_RECORDS.replace('(5 records)', '(6 records)'))).toThrow(/announced 6/);
    expect(() => parseSportRecords(SPORT_RECORDS.replace('Duration: 58:03', 'Duration: about an hour'))).toThrow(
      /duration/,
    );
    expect(() => parseSportRecords(SPORT_RECORDS.replace(/ {3}LabelId: 100000000000000005 \| /, '   '))).toThrow(
      /LabelId/,
    );
  });

  it('never keeps location or coordinates', () => {
    expect(JSON.stringify(activities)).not.toMatch(/Sample|10\.000000/);
  });
});

describe('sportOfCode', () => {
  it('groups COROS codes', () => {
    expect([100, 102, 200, 203, 104, 400, 900, 1001].map(sportOfCode)).toEqual([
      'run', 'run', 'ride', 'ride', 'other', 'other', 'other', 'other',
    ]);
  });
});

describe('parseRestingHr', () => {
  it('takes the median of the days listed', () => {
    expect(parseRestingHr(RESTING_HR)).toBe(46);
  });

  it('is null without days', () => {
    expect(parseRestingHr('Resting Heart Rate — Last 30 days\n========================\n')).toBeNull();
  });
});

describe('parseSex', () => {
  it('reads gender and nothing else', () => {
    expect(parseSex(USER_INFO)).toBe('female');
    expect(parseSex(USER_INFO.replace('Female', 'Male'))).toBe('male');
    expect(parseSex(USER_INFO.replace('Gender: Female\n', ''))).toBeUndefined();
  });
});
