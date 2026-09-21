import { extensionStorage, readStorage, writeStorage } from '../shortcuts/storage';

type Todo = { id: string; text: string; done: boolean };
const key = 'todos';
function parse(value: unknown): Todo[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(item => !item || typeof item.id !== 'string' || typeof item.text !== 'string' || typeof item.done !== 'boolean')) {
    throw new Error('Invalid todos');
  }
  return value;
}

export async function initializeTodos() {
  const panel = document.querySelector<HTMLDetailsElement>('#todo-panel')!;
  const form = document.querySelector<HTMLFormElement>('#todo-form')!;
  const input = document.querySelector<HTMLInputElement>('#todo-input')!;
  const list = document.querySelector<HTMLUListElement>('#todo-list')!;
  const error = document.querySelector<HTMLElement>('#todo-error')!;
  let todos: Todo[] = [], ready = false, saving = false;
  panel.open = matchMedia('(min-width: 1400px)').matches;

  function render() {
    document.querySelector('#todo-count')!.textContent = `${todos.filter(item => item.done).length} / ${todos.length}`;
    document.querySelector<HTMLElement>('#todo-empty')!.hidden = todos.length > 0;
    list.replaceChildren();
    for (const item of todos) {
      const row = document.createElement('li');
      const label = document.createElement('label');
      const check = document.createElement('input');
      check.type = 'checkbox'; check.checked = item.done;
      const text = document.createElement('span'); text.textContent = item.text;
      check.addEventListener('change', () => void save(items => items.map(todo => todo.id === item.id ? { ...todo, done: check.checked } : todo)));
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `刪除待辦：${item.text}`);
      remove.addEventListener('click', () => void save(items => items.filter(todo => todo.id !== item.id)));
      label.append(check, text); row.append(label, remove); list.append(row);
    }
    panel.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button').forEach(control => control.disabled = !ready || saving);
  }

  async function save(update: (items: Todo[]) => Todo[]): Promise<boolean> {
    if (!ready || saving) return false;
    saving = true; render();
    try {
      // Serialize edits across new tabs so two additions do not overwrite each other.
      await navigator.locks.request('taiwan-today-todos', async () => {
        const next = update(parse(await readStorage(key)));
        await writeStorage(key, next);
        todos = next;
      });
      error.textContent = '';
      return true;
    } catch { error.textContent = '待辦無法儲存，請稍後重試。'; return false; }
    finally { saving = false; render(); }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    if (await save(items => [...items, { id: crypto.randomUUID(), text, done: false }])) input.value = '';
    input.focus();
  });
  async function reload() {
    try { todos = parse(await readStorage(key)); ready = true; error.textContent = ''; }
    catch { ready = false; error.textContent = '待辦讀取失敗，請重新載入後再試。'; }
    render();
  }
  if (extensionStorage()) chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[key]) void reload();
  });
  else window.addEventListener('storage', event => { if (event.key === key || event.key === null) void reload(); });
  await reload();
}
