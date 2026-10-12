export function websiteGridIcon(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '22'); svg.setAttribute('height', '22');
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.6'); svg.setAttribute('aria-hidden', 'true');
  for (const [x, y] of [[4, 4], [13, 4], [4, 13], [13, 13]]) {
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', String(x)); rect.setAttribute('y', String(y));
    rect.setAttribute('width', '7'); rect.setAttribute('height', '7'); rect.setAttribute('rx', '1.8');
    svg.append(rect);
  }
  return svg;
}
