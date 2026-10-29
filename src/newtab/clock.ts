import { getLocale, t } from '../i18n';
import { clockTimezone, getCalendarContext } from '../calendar/context';
import { zonedDate } from '../calendar/gregorian';
import './clock.css';

function initializePresentation() {
  const container = document.querySelector<HTMLElement>('.clock-container')!;
  const presentation = document.createElement('dialog');
  presentation.id = 'clock-presentation';
  presentation.setAttribute('aria-label', t('時鐘展示模式'));
  document.body.append(presentation);
  const placeholder = document.createComment('clock position');
  const hint = t('雙擊切換展示模式，按 Esc 離開');
  container.tabIndex = 0;
  container.setAttribute('role', 'button');
  container.setAttribute('aria-label', hint);
  container.setAttribute('aria-haspopup', 'dialog');
  container.setAttribute('aria-expanded', 'false');
  container.title = hint;

  function toggle() {
    if (presentation.open) {
      presentation.close();
      return;
    }
    container.before(placeholder);
    presentation.append(container);
    presentation.style.backgroundColor = getComputedStyle(document.documentElement).backgroundColor;
    document.documentElement.classList.add('clock-presenting');
    container.setAttribute('aria-expanded', 'true');
    presentation.showModal();
    container.focus({ preventScroll: true });
  }
  container.addEventListener('dblclick', toggle);
  container.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  });
  presentation.addEventListener('close', () => {
    placeholder.replaceWith(container);
    document.documentElement.classList.remove('clock-presenting');
    container.setAttribute('aria-expanded', 'false');
    container.focus({ preventScroll: true });
  });
}

export function initializeClock() {
  initializePresentation();
  const face = document.getElementById('analog-clock')!;
  const digital = document.getElementById('digital-clock') as HTMLTimeElement;
  const date = document.createElement('time');
  date.className = 'clock-date';
  digital.after(date);
  const ticks = document.getElementById('clock-ticks')!;
  for (let index = 0; index < 60; index++) {
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', '60');
    tick.setAttribute('x2', '60');
    tick.setAttribute('y1', index % 5 === 0 ? '12' : '9');
    tick.setAttribute('y2', '7');
    tick.setAttribute('transform', `rotate(${index * 6} 60 60)`);
    tick.setAttribute('class', index % 5 === 0 ? 'clock-major-tick' : 'clock-minor-tick');
    ticks.append(tick);
  }
  let zone = '', formatter: Intl.DateTimeFormat, dateFormatter: Intl.DateTimeFormat;
  function update() {
    const timezone = clockTimezone();
    const caption = document.querySelector<HTMLElement>('.clock-caption')!;
    if (!timezone) {
      digital.textContent = '--:--:--'; digital.removeAttribute('datetime');
      date.textContent = ''; date.removeAttribute('datetime');
      caption.textContent = t('正在取得 GPS 時區…');
      digital.setAttribute('aria-label', caption.textContent); face.setAttribute('aria-label', caption.textContent);
      face.style.opacity = '0.35'; return;
    }
    face.style.opacity = '';
    if (timezone !== zone) {
      zone = timezone;
      formatter = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      dateFormatter = new Intl.DateTimeFormat(getLocale(), { timeZone: zone, year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    }
    caption.textContent = getCalendarContext().mode === 'taiwan' || (getCalendarContext().mode === 'travel' && getCalendarContext().travelClock === 'taiwan') ? t('台灣時間') : t('當地時間 · {0}', [zone]);
    const now = new Date();
    const time = formatter.format(now);
    date.textContent = dateFormatter.formatToParts(now).map(part =>
      part.type === 'weekday' && getLocale() === 'zh-TW' ? ` ${part.value}` : part.value
    ).join('');
    date.dateTime = zonedDate(now, zone).key;
    digital.textContent = time;
    digital.dateTime = time;
    digital.setAttribute('aria-label', `${caption.textContent} ${time}`);
    const [hour, minute, second] = time.split(':').map(Number);
    document.getElementById('clock-hour')!.setAttribute('transform', `rotate(${hour % 12 * 30 + minute / 2 + second / 120} 60 60)`);
    document.getElementById('clock-minute')!.setAttribute('transform', `rotate(${minute * 6 + second / 10} 60 60)`);
    document.getElementById('clock-second')!.setAttribute('transform', `rotate(${second * 6} 60 60)`);
    face.setAttribute('aria-label', `${caption.textContent} ${time}`);
  }
  let timer: ReturnType<typeof setInterval> | undefined;
  function resume() {
    if (timer !== undefined) clearInterval(timer);
    update();
    timer = document.hidden ? undefined : setInterval(update, 1000);
  }
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('focus', resume);
  window.addEventListener('calendarcontextchange', resume);
  resume();
}
