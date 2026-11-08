import { slideshow } from './slideshow';

/**
 * The Home slideshow's wiring: which element is which, what the controls
 * do, and when the clock may start. The engine itself is slideshow.ts,
 * which the Contact wall shares.
 */
export function initHome() {

  const show = document.querySelector<HTMLElement>('.show');
  const slideEls = Array.from(document.querySelectorAll<HTMLElement>('.slide'));

  if (show && slideEls.length) {
    const captions = new Map<number, HTMLElement>();
    for (const el of document.querySelectorAll<HTMLElement>('[data-caption]')) {
      captions.set(Number(el.dataset.caption), el);
    }
    const links = new Map<number, HTMLElement>();
    for (const el of document.querySelectorAll<HTMLElement>('[data-link]')) {
      links.set(Number(el.dataset.link), el);
    }
    const counter = document.querySelector<HTMLElement>('#counter');
    const pause = document.querySelector<HTMLButtonElement>('[data-control="pause"]');
    const total = slideEls.length;
    const pad = (n: number) => String(n).padStart(2, '0');

    /* 6s a slide: 600 in, 4.8s on, 600 out. The quotation is held 36s --
       133 words need about that long to read. */
    const holds = slideEls.map((el) => (el.classList.contains('quote') ? 34800 : 4800));

    const player = slideshow({
      slides: slideEls.map((el, i) => ({ el, hold: holds[i] })),
      onChange(index) {
        for (const [i, el] of captions) el.hidden = i !== index;
        for (const [i, el] of links) el.hidden = i !== index;
        if (counter) counter.textContent = `${pad(index + 1)} / ${pad(total)}`;
      },
      preload(index) {
        const img = slideEls[index]?.querySelector('img');
        if (img) img.loading = 'eager';
      },
    });

    /* the clock starts once the first photograph has decoded */
    const first = slideEls[0].querySelector('img');
    if (!first || (first.complete && first.naturalWidth > 0)) player.start();
    else first.decode().then(() => player.start()).catch(() => player.start());

    /* the pointer over the stage, or focus on a control, holds the frame */
    show.addEventListener('pointerenter', () => player.hold(true));
    show.addEventListener('pointerleave', () => player.hold(false));
    show.addEventListener('focusin', () => player.hold(true));
    show.addEventListener('focusout', () => player.hold(false));

    document.querySelector('[data-control="previous"]')?.addEventListener('click', () => player.previous());
    document.querySelector('[data-control="next"]')?.addEventListener('click', () => player.next());
    pause?.addEventListener('click', () => {
      const stopped = player.toggle();
      pause.textContent = stopped ? 'Play' : 'Pause';
      pause.setAttribute('aria-pressed', String(stopped));
    });

    /* click the photograph, or the arrow keys, or swipe */
    document.querySelector('.stage')?.addEventListener('click', () => player.next());

    document.addEventListener('keydown', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLButtonElement) return;
      if (event.key === 'ArrowLeft') player.previous();
      else if (event.key === 'ArrowRight') player.next();
      else return;
      event.preventDefault();
    });

    let startX = 0;
    let startY = 0;
    show.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].clientX;
      startY = e.changedTouches[0].clientY;
    }, { passive: true });
    show.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) player.next();
      else player.previous();
    }, { passive: true });
  }

}
