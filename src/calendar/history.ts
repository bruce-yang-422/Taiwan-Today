import taiwan from '../../data/history-taiwan.json';
import world from '../../data/history-world.json';
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
}

// Only existing collections are registered. Order controls display priority.
export const historyDatasets: readonly HistoryDataset[] = [
  { id: 'personal', label: '個人與家族', kind: 'personal', entries: personal },
  { id: 'taiwan', label: '台灣', kind: 'regional', entries: taiwan },
  { id: 'world', label: '國際', kind: 'regional', entries: world },
];

/** Composition boundary for future selected topic packs; no loading or UI here. */
export function composeHistory(datasets: readonly HistoryDataset[]): HistoryEntry[] {
  return datasets.flatMap(dataset => [...dataset.entries]);
}

const history = composeHistory(historyDatasets);
export default history;
