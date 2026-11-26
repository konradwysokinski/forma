/** COROS as Forma's data source: the MCP calls Forma makes, turned into its own types. */
import type { Athlete } from '../domain/types';
import { callTool } from './mcp';
import type { CorosTokens } from './oauth';
import { parseRestingHr, parseSex, parseSportRecords, toolText } from './parse';
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
  };
}

/** What the load formula can learn from COROS: a measured resting heart rate and sex. */
export async function corosAthlete(tokens: CorosTokens): Promise<{ restHr: number | null; sex: Athlete['sex'] }> {
  const [rest, profile] = await Promise.all([
    callTool(tokens, 'queryRestingHeartRate', { days: 30 }),
    callTool(tokens, 'queryUserInfo', {}),
  ]);
  return {
    restHr: parseRestingHr(toolText(rest, 'queryRestingHeartRate')),
    sex: parseSex(toolText(profile, 'queryUserInfo')),
  };
}
