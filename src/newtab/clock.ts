export function initializeClock() {
  const face = document.getElementById('analog-clock')!;
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
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Taipei', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  function update() {
    const time = formatter.format(new Date());
    const [hour, minute, second] = time.split(':').map(Number);
    document.getElementById('clock-hour')!.setAttribute('transform', `rotate(${hour % 12 * 30 + minute / 2 + second / 120} 60 60)`);
    document.getElementById('clock-minute')!.setAttribute('transform', `rotate(${minute * 6 + second / 10} 60 60)`);
    document.getElementById('clock-second')!.setAttribute('transform', `rotate(${second * 6} 60 60)`);
    face.setAttribute('aria-label', `台灣時間 ${time}`);
  }
  let timer: ReturnType<typeof setInterval> | undefined;
  function resume() {
    if (timer !== undefined) clearInterval(timer);
    update();
    timer = document.hidden ? undefined : setInterval(update, 1000);
  }
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('focus', resume);
  resume();
}
