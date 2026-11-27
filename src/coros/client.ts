/** COROS as Forma's data source: the MCP calls Forma makes, turned into its own types. */
import type { Athlete, RestingHrDay } from '../domain/types';
import { callTool } from './mcp';
import type { CorosTokens } from './oauth';
import { medianRestingHr, parseElevation, parseRestingHrDays, parseSex, parseSleep, parseSportRecords, toolText } from './parse';
import { PAGE_LIMIT, type CorosSource } from './sync';

/** "2026-11-26" → "20261126", COROS's date format. */
const corosDate = (day: string) => day.replace(/-/g, '');

export function corosSource(tokens: CorosTokens): CorosSource {
  return {
    async activities({ from, to }) {
      const tool = 'querySportRecords';
      const result = await callTool(tokens, tool, { startDate: corosDate(from), endDate: corosDate(to), limit: PAGE_LIMIT });
      return parseSportRecords(toolText(result, tool));
    },
    async sleep({ from, to }) {
      const tool = 'querySleepOverview';
      const result = await callTool(tokens, tool, { startDate: corosDate(from), endDate: corosDate(to) });
      return parseSleep(toolText(result, tool));
    },
    async elevation({ id, sportCode }) {
      const tool = 'getActivityDetail';
      const result = await callTool(tokens, tool, { labelId: id, sportType: sportCode });
      return parseElevation(toolText(result, tool));
    },
  };
}

/** What COROS tells about the athlete: resting heart rate (the median for the load formula, the mornings for Today) and sex. */
export async function corosAthlete(
  tokens: CorosTokens,
): Promise<{ restHr: number | null; restingHr: RestingHrDay[]; sex: Athlete['sex'] }> {
  const [rest, profile] = await Promise.all([
    callTool(tokens, 'queryRestingHeartRate', { days: 30 }),
    callTool(tokens, 'queryUserInfo', {}),
  ]);
  const restingHr = parseRestingHrDays(toolText(rest, 'queryRestingHeartRate'));
  return {
    restHr: medianRestingHr(restingHr),
    restingHr,
    sex: parseSex(toolText(profile, 'queryUserInfo')),
  };
}
