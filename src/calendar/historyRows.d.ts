import type { HistoryEntry } from './history';

export function convertRows(
  rows: unknown[][],
  category?: string,
  dateParser?: (value: number) => { y: number; m: number; d: number } | null,
): { records: HistoryEntry[]; errors: string[] };
