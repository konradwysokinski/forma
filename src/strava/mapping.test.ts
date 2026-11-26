import { describe, expect, it } from 'vitest';
import { sportOf, toActivity } from './mapping';

describe('toActivity', () => {
  it('keeps local time, distance, moving time and heart rate', () => {
    expect(
      toActivity({
        id: 123,
        name: 'Morning run',
        sport_type: 'TrailRun',
        start_date_local: '2026-11-09T08:12:00Z',
        distance: 10210.4,
        moving_time: 3125,
        total_elevation_gain: 212,
        average_heartrate: 151.3,
        has_heartrate: true,
      }),
    ).toEqual({
      id: '123',
      name: 'Morning run',
      sport: 'run',
      start: '2026-11-09T08:12:00',
      distance: 10210.4,
      movingTime: 3125,
      elevationGain: 212,
      averageHeartrate: 151.3,
    });
  });

  it('leaves heart rate out when there was no sensor', () => {
    const a = toActivity({ id: 1, name: 'Ride', sport_type: 'Ride', start_date_local: '2026-11-09T08:00:00Z', distance: 30000, has_heartrate: false });
    expect(a.averageHeartrate).toBeUndefined();
    expect(a.movingTime).toBe(0);
  });

  it('groups sport types', () => {
    expect(sportOf('VirtualRun')).toBe('run');
    expect(sportOf('GravelRide')).toBe('ride');
    expect(sportOf('Swim')).toBe('other');
    expect(sportOf(undefined)).toBe('other');
  });
});
