import { historyDatasets, type HistorySourceSetting } from '../calendar/history';

export function createHistorySourceControls(save: (sources: HistorySourceSetting[]) => Promise<void>) {
  const list = document.getElementById('history-sources-list')!;
  return (sources: readonly HistorySourceSetting[]) => {
    list.replaceChildren();
    sources.forEach((source, index) => {
      const dataset = historyDatasets.find(d => d.id === source.id)!;
      const row = document.createElement('li'); row.dataset.source = source.id;
      const label = document.createElement('label');
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = source.enabled;
      check.id = `history-source-${source.id}`;
      check.addEventListener('change', async () => {
        await save(sources.map(s => s.id === source.id ? { ...s, enabled: check.checked } : { ...s }));
        document.getElementById(check.id)?.focus();
      });
      label.append(check, document.createTextNode(dataset.label)); row.append(label);
      const actions = document.createElement('span'); actions.className = 'source-move';
      for (const [delta, text, name] of [[-1, '↑', '上移'], [1, '↓', '下移']] as const) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
        button.id = `source-${source.id}-${delta}`; button.setAttribute('aria-label', `${name}${dataset.label}`);
        button.disabled = index + delta < 0 || index + delta >= sources.length;
        button.addEventListener('click', async () => {
          const next = sources.map(s => ({ ...s }));
          [next[index], next[index + delta]] = [next[index + delta], next[index]];
          await save(next);
          const replacement = document.getElementById(button.id) as HTMLButtonElement;
          (replacement.disabled ? document.getElementById(check.id) : replacement)?.focus();
        });
        actions.append(button);
      }
      row.append(actions); list.append(row);
    });
  };
}
