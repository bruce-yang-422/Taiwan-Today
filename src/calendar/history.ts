import { getPublicData } from '../data/publicData';
import personal from '../../data/history-personal.json';

export interface HistoryEntry {
  date: string;
  year: number;
  title: string;
  summary: string;
  region: string;
  keyword?: string;
  source?: string;
  sourceUrl?: string;
  /** Optional subject tags; independent of the event's region. */
  tags?: readonly string[];
}

/** A local history collection. Future topic packs use this same contract. */
export interface HistoryDataset {
  /** Stable identifier used independently of the display name. */
  id: string;
  label: string;
  kind: 'personal' | 'regional' | 'topic';
  entries: readonly HistoryEntry[];
  /** New optional topic packs are disabled unless explicitly enabled. */
  defaultEnabled?: boolean;
}

// Only existing collections are registered. Order controls display priority.
export const historyDatasets: readonly HistoryDataset[] = [
  { id: 'personal', label: '私人（個人／家族）', kind: 'personal', entries: personal.data },
  { id: 'taiwan', label: '台灣', kind: 'regional', get entries() { return getPublicData().taiwan; } },
  { id: 'world', label: '國際', kind: 'regional', get entries() { return getPublicData().world; } },
  { id: 'tech', label: '科技', kind: 'topic', get entries() { return getPublicData().tech; } },
  { id: 'entertainment', label: '影音娛樂', kind: 'topic', get entries() { return getPublicData().entertainment; } },
];

export interface HistorySourceSetting { id: string; enabled: boolean }
export function normalizeHistorySources(value: unknown, datasets = historyDatasets): HistorySourceSetting[] {
  const result: HistorySourceSetting[] = [];
  const seen = new Set<string>();
  if (Array.isArray(value)) for (const entry of value) {
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || seen.has(entry.id)) continue;
    const dataset = datasets.find(d => d.id === entry.id);
    if (!dataset) continue;
    seen.add(entry.id);
    result.push({ id: entry.id, enabled: typeof entry.enabled === 'boolean' ? entry.enabled : (dataset.defaultEnabled ?? dataset.kind !== 'topic') });
  }
  for (const dataset of datasets) if (!seen.has(dataset.id)) result.push({ id: dataset.id, enabled: dataset.defaultEnabled ?? dataset.kind !== 'topic' });
  return result;
}

/** Composition boundary for future selected topic packs; no loading or UI here. */
export function composeHistory(datasets: readonly HistoryDataset[]): HistoryEntry[] {
  return datasets.flatMap(dataset => [...dataset.entries]);
}

const history = composeHistory(historyDatasets);
export default history;
