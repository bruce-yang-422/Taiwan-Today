import { dailyCalendar } from '../calendar/dailyCalendar';
import { taipeiDate } from '../calendar/gregorian';
import { lunarDate } from '../calendar/lunar';
import { getPublicData } from '../data/publicData';

export function createConceptLayouts(onSelect: (date?: Date) => void) {
  const main = document.querySelector('main')!;
  const widgets = ['.calendar-clock-group', '#search-form', '.shortcuts-section', '.history-section', '.todo-note'].map(selector => {
    const element = document.querySelector<HTMLElement>(selector)!;
    const anchor = document.createComment(`home: ${selector}`);
    element.before(anchor);
    return { element, anchor };
  });
  const [calendar, search, shortcuts, history, todos] = widgets.map(widget => widget.element);
  const shell = document.createElement('div'); shell.className = 'concept-shell'; shell.hidden = true;
  const sidebar = document.createElement('aside'); sidebar.className = 'concept-sidebar';
  const stage = document.createElement('div'); stage.className = 'concept-stage';
  const rail = document.createElement('aside'); rail.className = 'concept-rail';
  const bottom = document.createElement('div'); bottom.className = 'concept-bottom';
  shell.append(sidebar, stage, rail, bottom); main.prepend(shell);

  const quote = document.createElement('section'); quote.className = 'daily-quote'; quote.id = 'daily-quote'; quote.setAttribute('aria-label', '每日一句');
  const quoteHeading = document.createElement('h2'); quoteHeading.textContent = '每日一句';
  const quoteText = document.createElement('blockquote');
  const quoteSource = document.createElement('p');
  quote.append(quoteHeading, quoteText, quoteSource);
  const selectionLabel = document.createElement('p'); selectionLabel.className = 'selected-date-label'; selectionLabel.id = 'selected-date-label'; selectionLabel.setAttribute('role', 'status');
  const todayContext = document.createElement('p'); todayContext.className = 'today-context'; todayContext.id = 'today-context';
  const clockCaption = calendar.querySelector<HTMLElement>('.clock-caption')!;
  const dateSection = calendar.querySelector<HTMLElement>('.calendar')!;
  const monthView = document.createElement('section'); monthView.id = 'month-view'; monthView.setAttribute('aria-label', '月曆');
  const toolbar = document.createElement('div'); toolbar.className = 'month-toolbar';
  const title = document.createElement('h2'); title.id = 'month-view-title'; title.setAttribute('aria-live', 'polite');
  const button = (text: string, label: string, action: () => void) => {
    const element = document.createElement('button'); element.type = 'button'; element.textContent = text; element.setAttribute('aria-label', label); element.addEventListener('click', action); return element;
  };
  let currentStyle = '', selected = '', todayKey = '';
  let weekStart: 0 | 1 = 0;
  let quoteCategory = 'daily';
  let year = taipeiDate().year, month = taipeiDate().month;
  const prev = button('‹', '上一個月', () => changeMonth(-1));
  const next = button('›', '下一個月', () => changeMonth(1));
  const today = button('今天', '回到今天', () => {
    const date = taipeiDate(); year = date.year; month = date.month; selected = ''; onSelect(); renderMonth();
  });
  toolbar.append(prev, title, next, today);
  const grid = document.createElement('div'); grid.className = 'month-grid'; grid.setAttribute('role', 'group'); grid.setAttribute('aria-labelledby', title.id);
  monthView.append(toolbar, grid);
  history.id = 'history-section'; calendar.id = 'date-details';
  function changeMonth(delta: number) {
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    year = date.getUTCFullYear(); month = date.getUTCMonth() + 1; renderMonth();
  }
  function renderMonth() {
    title.textContent = `${year} 年 ${month} 月`;
    prev.disabled = year === 1900 && month === 1; next.disabled = year === 2100 && month === 12;
    grid.replaceChildren();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    for (let column = 0; column < 7; column++) {
      const day = weekdays[(column + weekStart) % 7];
      const heading = document.createElement('div'); heading.className = 'month-weekday'; heading.textContent = day; grid.append(heading);
    }
    const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() - weekStart + 7) % 7;
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cells = Math.ceil((offset + days) / 7) * 7;
    const now = taipeiDate();
    const selectedKey = selected || now.key;
    selectionLabel.textContent = `選取日期 · ${selectedKey.replaceAll('-', '/')} ${selectedKey === now.key ? '（今天）' : ''}`;
    dateSection.setAttribute('aria-label', `選取日期 ${selectedKey}`);
    todayContext.textContent = `今天是 ${now.key.replaceAll('-', '/')}。時鐘、今日待辦與今日語錄不隨選取日期切換；待辦跨日保留。`;
    for (let index = 0; index < cells; index++) {
      const day = index - offset + 1;
      if (day < 1 || day > days) { const blank = document.createElement('div'); blank.className = 'month-blank'; grid.append(blank); continue; }
      const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(`${key}T12:00:00+08:00`);
      const info = dailyCalendar(date);
      const cell = button('', key, () => {
        selected = key; onSelect(date); renderMonth(); grid.querySelector<HTMLButtonElement>(`[aria-label="${key}"]`)?.focus();
      });
      const weekday = (index + weekStart) % 7;
      cell.className = 'month-cell'; cell.classList.toggle('weekend', weekday === 0 || weekday === 6);
      cell.setAttribute('aria-pressed', String(key === (selected || now.key)));
      if (key === now.key) cell.setAttribute('aria-current', 'date');
      const number = document.createElement('span'); number.className = 'month-number'; number.textContent = String(day);
      const lunar = lunarDate(info).lunar;
      const lunarLabel = document.createElement('span'); lunarLabel.className = 'month-lunar';
      lunarLabel.textContent = lunar.getDay() === 1 ? info.lunar.split('・').pop()! : lunar.getDayInChinese();
      const detail = document.createElement('span'); detail.className = 'month-detail'; detail.textContent = info.terms.today || info.holiday || info.festivals[0] || '';
      cell.title = `${key} · 農曆 ${info.lunar}${detail.textContent ? ` · ${detail.textContent}` : ''}`;
      cell.append(number, lunarLabel);
      if (detail.textContent) cell.append(detail);
      grid.append(cell);
    }
  }
  function refresh() {
    const date = taipeiDate();
    if (todayKey === date.key) return;
    if (todayKey && !selected) { year = date.year; month = date.month; }
    todayKey = date.key;
    const matchingQuotes = getPublicData().quotes.filter(item => item.category === quoteCategory);
    const item = matchingQuotes[Math.floor(Date.UTC(date.year, date.month - 1, date.day) / 86400000) % matchingQuotes.length];
    quoteText.textContent = item?.text ?? '每日一句尚未收錄。';
    quoteSource.textContent = item?.source ? `— ${item.source}` : '';
    if (currentStyle === 'workspace') renderMonth();
  }
  return {
    refresh,
    refreshData() { todayKey = ''; refresh(); },
    setQuoteCategory(value: string) {
      if (value === quoteCategory) return;
      quoteCategory = value; todayKey = ''; refresh();
    },
    setWeekStart(value: 0 | 1) {
      if (weekStart === value) return;
      weekStart = value;
      if (currentStyle === 'workspace') renderMonth();
    },
    setStyle(style: string) {
      if (currentStyle === style) return;
      currentStyle = style;
      widgets.forEach(({ element, anchor }) => anchor.after(element));
      monthView.remove(); quote.remove(); selectionLabel.remove(); todayContext.remove();
      quoteHeading.textContent = style === 'workspace' ? '今日語錄' : '每日一句';
      quote.setAttribute('aria-label', quoteHeading.textContent);
      clockCaption.textContent = style === 'workspace' ? '現在時間 · 台灣' : '台灣時間';
      shell.hidden = !['workspace', 'reading'].includes(style);
      if (style === 'workspace') {
        sidebar.append(shortcuts); stage.append(search, monthView, history); rail.append(selectionLabel, calendar, todayContext, todos, quote);
        renderMonth();
      } else if (style === 'reading') {
        sidebar.append(calendar); stage.append(quote, history, todos); bottom.append(search, shortcuts);
      } else {
        history.before(quote);
      }
      if (style !== 'workspace') { selected = ''; onSelect(); }
      refresh();
    },
  };
}
