// Carruseles horizontales (pestañas, categorías, chips) con barra de scroll oculta:
// en celular se deslizan con el dedo, pero con mouse o touchpad no había forma de moverlos.
// Esto habilita, para todo contenedor con overflow-x auto/scroll:
//  - rueda del mouse vertical -> desplazamiento horizontal
//  - arrastrar con el mouse para desplazar (sin disparar el clic al soltar)

const isHorizontalScroller = (el) => {
  if (!(el instanceof HTMLElement)) return false;
  const ox = getComputedStyle(el).overflowX;
  return (ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth + 1;
};

const findScroller = (target) => {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.body) {
    if (isHorizontalScroller(el)) return el;
    el = el.parentElement;
  }
  return null;
};

export function enableHorizontalScroll() {
  if (typeof window === 'undefined' || window.__gloryHScroll) return;
  window.__gloryHScroll = true;

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
    const el = findScroller(e.target);
    if (!el) return;
    // Si el contenedor también se desplaza en vertical, se respeta el scroll normal
    const oy = getComputedStyle(el).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) return;
    const max = el.scrollWidth - el.clientWidth;
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    if ((delta < 0 && el.scrollLeft <= 0) || (delta > 0 && el.scrollLeft >= max - 1)) return;
    el.scrollLeft += delta;
    e.preventDefault();
  }, { passive: false });

  let drag = null;
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    const el = findScroller(e.target);
    if (el) drag = { el, x: e.clientX, left: el.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 6) return;
    drag.moved = true;
    drag.el.scrollLeft = drag.left - dx;
    drag.el.style.cursor = 'grabbing';
    drag.el.style.userSelect = 'none';
  });
  const end = () => {
    if (!drag) return;
    const { el, moved } = drag;
    el.style.cursor = '';
    el.style.userSelect = '';
    drag = null;
    if (moved) {
      // Evita que soltar el arrastre active la pestaña o el botón bajo el cursor
      const block = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', block, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', block, { capture: true }), 0);
    }
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
}
