import patterns from './errorPatterns.json';
import { getLocale, t } from './index';

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchers = patterns.map(source => ({
  source,
  expression: new RegExp(`^${source.split(/\{\d+\}/).map(escape).join('(.*?)')}$`),
}));

/** Translate known validator/worker errors at the UI boundary, preserving raw data. */
export function errorMessage(message: string, depth = 0): string {
  if (getLocale() === 'zh-TW' || depth > 4) return message;
  if (message.includes('\n')) return message.split('\n').map(line => errorMessage(line, depth + 1)).join('\n');
  const exact = t(message);
  if (exact !== message) return exact;
  for (const { source, expression } of matchers) {
    const match = expression.exec(message);
    if (match) return t(source, match.slice(1).map(value => errorMessage(value, depth + 1)));
  }
  return message;
}
