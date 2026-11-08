import { slideshow } from './slideshow';

/**
 * The Contact wall: the same engine as the Home, eight framed prints,
 * six seconds each. The 1px rule across the foot of the wall fills in
 * six steps over those six seconds, and holds with the pointer on it.
 */
export function initPrints() {
  const wall = document.querySelector<HTMLElement>('.wall');
  const slides = Array.from(document.querySelectorAll<HTMLElement>('.print.slide'));
  if (!wall || !slides.length) return;

  const progress = document.querySelector<HTMLElement>('.progress');
  const wheres = new Map<number, HTMLElement>();
  for (const el of document.querySelectorAll<HTMLElement>('[data-where]')) {
    wheres.set(Number(el.dataset.where), el);
  }
  const whats = new Map<number, HTMLElement>();
  for (const el of document.querySelectorAll<HTMLElement>('[data-what]')) {
    whats.set(Number(el.dataset.what), el);
  }

  const player = slideshow({
    slides: slides.map((el) => ({ el, hold: 4800 })),
    onChange(index) {
      for (const [i, el] of wheres) el.hidden = i !== index;
      for (const [i, el] of whats) el.hidden = i !== index;
      if (progress) {
        /* restart the rule for each print */
        progress.classList.remove('running');
        void progress.offsetWidth;
        progress.classList.add('running');
      }
    },
  });

  const first = slides[0].querySelector('img');
  if (!first || (first.complete && first.naturalWidth > 0)) player.start();
  else first.decode().then(() => player.start()).catch(() => player.start());

  wall.addEventListener('pointerenter', () => player.hold(true));
  wall.addEventListener('pointerleave', () => player.hold(false));
}
